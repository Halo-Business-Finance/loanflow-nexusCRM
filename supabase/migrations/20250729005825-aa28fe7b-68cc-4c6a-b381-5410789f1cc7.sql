-- Enhanced Security Features

-- Password Policy Table
CREATE TABLE IF NOT EXISTS public.password_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    min_length INTEGER NOT NULL DEFAULT 12,
    require_uppercase BOOLEAN NOT NULL DEFAULT true,
    require_lowercase BOOLEAN NOT NULL DEFAULT true,
    require_numbers BOOLEAN NOT NULL DEFAULT true,
    require_special_chars BOOLEAN NOT NULL DEFAULT true,
    max_age_days INTEGER NOT NULL DEFAULT 90,
    prevent_reuse_count INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Password History for preventing reuse
CREATE TABLE IF NOT EXISTS public.password_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session Security Enhancement
CREATE TABLE IF NOT EXISTS public.secure_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location_data JSONB,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    risk_score INTEGER NOT NULL DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    mfa_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Multi-Factor Authentication
CREATE TABLE IF NOT EXISTS public.mfa_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    secret_key TEXT, -- TOTP secret
    backup_codes TEXT[], -- Emergency backup codes
    phone_number TEXT, -- For SMS MFA
    preferred_method TEXT NOT NULL DEFAULT 'totp', -- totp, sms, email
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rate Limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address or user ID
    action_type TEXT NOT NULL, -- login, api_call, password_reset
    attempt_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    block_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(identifier, action_type)
);

-- Security Notifications
CREATE TABLE IF NOT EXISTS public.security_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    notification_type TEXT NOT NULL, -- suspicious_login, password_change, mfa_enabled
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data Encryption Settings
CREATE TABLE IF NOT EXISTS public.encryption_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT NOT NULL UNIQUE,
    key_purpose TEXT NOT NULL, -- field_encryption, file_encryption, etc
    algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_rotated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all security tables
ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Security Tables

-- Password Policies (Admin only)
CREATE POLICY "Admins can manage password policies" ON public.password_policies
FOR ALL USING (has_role('admin'::user_role));

-- Password History (Users can view their own)
CREATE POLICY "Users can view their password history" ON public.password_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage password history" ON public.password_history
FOR ALL WITH CHECK (true);

-- Secure Sessions
CREATE POLICY "Users can view their own sessions" ON public.secure_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.secure_sessions
FOR ALL WITH CHECK (true);

CREATE POLICY "Admins can view all sessions" ON public.secure_sessions
FOR SELECT USING (has_role('admin'::user_role));

-- MFA Settings
CREATE POLICY "Users can manage their MFA settings" ON public.mfa_settings
FOR ALL USING (auth.uid() = user_id);

-- Rate Limits (System and Admin only)
CREATE POLICY "Admins can view rate limits" ON public.rate_limits
FOR SELECT USING (has_role('admin'::user_role));

CREATE POLICY "System can manage rate limits" ON public.rate_limits
FOR ALL WITH CHECK (true);

-- Security Notifications
CREATE POLICY "Users can view their security notifications" ON public.security_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their security notifications" ON public.security_notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create security notifications" ON public.security_notifications
FOR INSERT WITH CHECK (true);

-- Encryption Keys (Admin only)
CREATE POLICY "Admins can manage encryption keys" ON public.encryption_keys
FOR ALL USING (has_role('admin'::user_role));

-- Security Functions

-- Function to check password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to log security events with enhanced details
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

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action_type TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_user_id ON public.secure_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_token ON public.secure_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_expires ON public.secure_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON public.mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_security_notifications_user_id ON public.security_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_security_notifications_unread ON public.security_notifications(user_id, is_read);

-- Triggers for updated_at
CREATE TRIGGER update_password_policies_updated_at
    BEFORE UPDATE ON public.password_policies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mfa_settings_updated_at
    BEFORE UPDATE ON public.mfa_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default password policy
INSERT INTO public.password_policies (
    min_length, require_uppercase, require_lowercase, 
    require_numbers, require_special_chars, max_age_days, 
    prevent_reuse_count, is_active
) VALUES (
    12, true, true, true, true, 90, 5, true
) ON CONFLICT DO NOTHING;