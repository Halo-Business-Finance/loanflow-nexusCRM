-- Fix security warnings: Set search_path for all functions

-- Fix validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    policy RECORD;
    result JSONB := '{"valid": true, "errors": []}'::JSONB;
    errors TEXT[] := '{}';
BEGIN
    -- Get active password policy
    SELECT * INTO policy FROM public.password_policies WHERE is_active = true LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN '{"valid": false, "errors": ["No password policy found"]}'::JSONB;
    END IF;
    
    -- Check length
    IF LENGTH(password) < policy.min_length THEN
        errors := array_append(errors, 'Password must be at least ' || policy.min_length || ' characters long');
    END IF;
    
    -- Check uppercase
    IF policy.require_uppercase AND password !~ '[A-Z]' THEN
        errors := array_append(errors, 'Password must contain at least one uppercase letter');
    END IF;
    
    -- Check lowercase
    IF policy.require_lowercase AND password !~ '[a-z]' THEN
        errors := array_append(errors, 'Password must contain at least one lowercase letter');
    END IF;
    
    -- Check numbers
    IF policy.require_numbers AND password !~ '[0-9]' THEN
        errors := array_append(errors, 'Password must contain at least one number');
    END IF;
    
    -- Check special characters
    IF policy.require_special_chars AND password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
        errors := array_append(errors, 'Password must contain at least one special character');
    END IF;
    
    -- Build result
    IF array_length(errors, 1) > 0 THEN
        result := jsonb_build_object('valid', false, 'errors', errors);
    END IF;
    
    RETURN result;
END;
$$;

-- Fix log_enhanced_security_event function
CREATE OR REPLACE FUNCTION public.log_enhanced_security_event(
    p_user_id UUID DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium',
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_location JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    event_id UUID;
    risk_score INTEGER := 0;
BEGIN
    -- Calculate risk score based on various factors
    IF p_ip_address IS NOT NULL THEN
        -- Check if IP is from a different country (simplified)
        IF EXISTS (SELECT 1 FROM public.ip_restrictions WHERE ip_address = p_ip_address AND is_allowed = false) THEN
            risk_score := risk_score + 50;
        END IF;
    END IF;
    
    -- Add to security events
    INSERT INTO public.security_events (
        user_id, event_type, severity, details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_event_type, p_severity, 
        p_details || jsonb_build_object('risk_score', risk_score, 'device_fingerprint', p_device_fingerprint, 'location', p_location),
        p_ip_address, p_user_agent
    ) RETURNING id INTO event_id;
    
    -- Create security notification for high-risk events
    IF risk_score > 70 OR p_severity = 'high' OR p_severity = 'critical' THEN
        INSERT INTO public.security_notifications (
            user_id, notification_type, title, message, severity,
            metadata
        ) VALUES (
            p_user_id, p_event_type, 
            'Security Alert: ' || p_event_type,
            'A high-risk security event was detected on your account.',
            p_severity,
            jsonb_build_object('event_id', event_id, 'risk_score', risk_score)
        );
    END IF;
    
    RETURN event_id;
END;
$$;

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action_type TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_record RECORD;
    is_allowed BOOLEAN := true;
    attempts_remaining INTEGER;
BEGIN
    -- Get or create rate limit record
    SELECT * INTO current_record 
    FROM public.rate_limits 
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    IF FOUND THEN
        -- Check if window has expired
        IF current_record.window_start < (now() - INTERVAL '1 minute' * p_window_minutes) THEN
            -- Reset the window
            UPDATE public.rate_limits 
            SET attempt_count = 1, 
                window_start = now(), 
                is_blocked = false, 
                block_until = NULL,
                updated_at = now()
            WHERE id = current_record.id;
            attempts_remaining := p_max_attempts - 1;
        ELSE
            -- Increment attempt count
            UPDATE public.rate_limits 
            SET attempt_count = attempt_count + 1,
                updated_at = now()
            WHERE id = current_record.id;
            
            attempts_remaining := p_max_attempts - (current_record.attempt_count + 1);
            
            -- Check if limit exceeded
            IF current_record.attempt_count + 1 >= p_max_attempts THEN
                UPDATE public.rate_limits 
                SET is_blocked = true,
                    block_until = now() + INTERVAL '1 hour'
                WHERE id = current_record.id;
                is_allowed := false;
                attempts_remaining := 0;
            END IF;
        END IF;
    ELSE
        -- Create new rate limit record
        INSERT INTO public.rate_limits (identifier, action_type, attempt_count, window_start)
        VALUES (p_identifier, p_action_type, 1, now());
        attempts_remaining := p_max_attempts - 1;
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', is_allowed,
        'attempts_remaining', attempts_remaining,
        'reset_time', (now() + INTERVAL '1 minute' * p_window_minutes)
    );
END;
$$;