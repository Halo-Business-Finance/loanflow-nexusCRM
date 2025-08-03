-- Fix critical security vulnerabilities

-- 1. Fix overly permissive RLS policies for active_sessions
DROP POLICY IF EXISTS "System can manage sessions" ON active_sessions;
CREATE POLICY "System can create sessions" ON active_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update sessions" ON active_sessions FOR UPDATE USING (auth.uid() = user_id);

-- 2. Fix overly permissive RLS policies for contact_entities  
DROP POLICY IF EXISTS "All authenticated users can delete all contact entities" ON contact_entities;
DROP POLICY IF EXISTS "All authenticated users can update all contact entities" ON contact_entities;
DROP POLICY IF EXISTS "All authenticated users can view all contact entities" ON contact_entities;

-- 3. Add proper session validation function with enhanced security
CREATE OR REPLACE FUNCTION public.validate_session_with_security_checks(
  p_user_id uuid, 
  p_session_token text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
  config_record RECORD;
  is_valid boolean := false;
  reason text := 'Session validation failed';
  risk_score integer := 0;
  security_flags jsonb := '[]'::jsonb;
BEGIN
  -- Get session config
  SELECT * INTO config_record FROM public.session_config LIMIT 1;
  
  -- Get active session
  SELECT * INTO session_record 
  FROM public.active_sessions 
  WHERE user_id = p_user_id 
    AND session_token = p_session_token 
    AND is_active = true;
  
  IF FOUND THEN
    -- Check if session has expired
    IF session_record.expires_at > now() THEN
      -- Check if last activity is within timeout
      IF session_record.last_activity > (now() - INTERVAL '1 minute' * config_record.session_timeout_minutes) THEN
        -- Additional security checks
        
        -- Check for IP address changes (potential session hijacking)
        IF p_ip_address IS NOT NULL AND session_record.ip_address IS NOT NULL 
           AND session_record.ip_address != p_ip_address THEN
          risk_score := risk_score + 30;
          security_flags := security_flags || '"ip_change"'::jsonb;
        END IF;
        
        -- Check for user agent changes
        IF p_user_agent IS NOT NULL AND session_record.user_agent IS NOT NULL 
           AND session_record.user_agent != p_user_agent THEN
          risk_score := risk_score + 20;
          security_flags := security_flags || '"user_agent_change"'::jsonb;
        END IF;
        
        -- Check for suspicious activity patterns
        IF session_record.last_activity < (now() - INTERVAL '1 hour') THEN
          risk_score := risk_score + 10;
          security_flags := security_flags || '"long_inactive"'::jsonb;
        END IF;
        
        -- Determine if session is valid based on risk score
        IF risk_score < 50 THEN
          is_valid := true;
          reason := 'Session valid';
          
          -- Update last activity and security info
          UPDATE public.active_sessions 
          SET 
            last_activity = now(),
            ip_address = COALESCE(p_ip_address, ip_address),
            user_agent = COALESCE(p_user_agent, user_agent)
          WHERE id = session_record.id;
        ELSE
          reason := 'Session flagged for suspicious activity';
          -- Log security event
          INSERT INTO public.security_events (user_id, event_type, severity, details, ip_address, user_agent)
          VALUES (p_user_id, 'suspicious_session_activity', 'medium', 
                  jsonb_build_object('risk_score', risk_score, 'flags', security_flags),
                  p_ip_address, p_user_agent);
        END IF;
      ELSE
        reason := 'Session timeout due to inactivity';
        -- Deactivate expired session
        UPDATE public.active_sessions 
        SET is_active = false
        WHERE id = session_record.id;
      END IF;
    ELSE
      reason := 'Session expired';
      -- Deactivate expired session
      UPDATE public.active_sessions 
      SET is_active = false
      WHERE id = session_record.id;
    END IF;
  ELSE
    reason := 'Session not found or inactive';
  END IF;
  
  -- Log validation attempt
  INSERT INTO public.audit_logs (user_id, action, table_name, new_values)
  VALUES (p_user_id, 'session_validation', 'active_sessions',
          jsonb_build_object('valid', is_valid, 'reason', reason, 'risk_score', risk_score));
  
  RETURN jsonb_build_object(
    'valid', is_valid,
    'reason', reason,
    'requires_reauth', NOT is_valid,
    'risk_score', risk_score,
    'security_flags', security_flags
  );
END;
$$;

-- 4. Enhanced input validation function with XSS protection
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input_enhanced(
  p_input text, 
  p_field_type text DEFAULT 'text'::text, 
  p_max_length integer DEFAULT 255, 
  p_allow_html boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  sanitized_input text;
  is_valid boolean := true;
  errors text[] := '{}';
  xss_patterns text[] := ARRAY[
    '<script[^>]*>.*?</script>',
    'javascript:',
    'vbscript:',
    'onload\s*=',
    'onerror\s*=',
    'onclick\s*=',
    'onmouseover\s*=',
    'onfocus\s*=',
    'onblur\s*=',
    'onkeyup\s*=',
    'onchange\s*=',
    '<iframe[^>]*>',
    '<object[^>]*>',
    '<embed[^>]*>',
    '<link[^>]*>',
    '<meta[^>]*>',
    'expression\s*\(',
    'url\s*\(',
    'import\s*\('
  ];
  pattern text;
BEGIN
  -- Initial sanitization
  sanitized_input := trim(p_input);
  
  -- Length validation
  IF length(sanitized_input) > p_max_length THEN
    is_valid := false;
    errors := array_append(errors, 'Input exceeds maximum length of ' || p_max_length);
  END IF;
  
  -- XSS detection and prevention
  IF NOT p_allow_html THEN
    FOREACH pattern IN ARRAY xss_patterns
    LOOP
      IF sanitized_input ~* pattern THEN
        is_valid := false;
        errors := array_append(errors, 'Potentially malicious content detected');
        -- Log security event
        INSERT INTO public.security_events (event_type, severity, details)
        VALUES ('xss_attempt', 'high', jsonb_build_object('pattern', pattern, 'input', left(p_input, 100)));
        EXIT; -- Stop checking once malicious content is found
      END IF;
    END LOOP;
    
    -- Remove HTML tags if no malicious content found but HTML not allowed
    IF is_valid THEN
      sanitized_input := regexp_replace(sanitized_input, '<[^>]*>', '', 'g');
    END IF;
  END IF;
  
  -- Field type specific validation
  CASE p_field_type
    WHEN 'email' THEN
      IF NOT sanitized_input ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        is_valid := false;
        errors := array_append(errors, 'Invalid email format');
      END IF;
    WHEN 'phone' THEN
      -- Remove all non-digits for phone validation
      sanitized_input := regexp_replace(sanitized_input, '[^0-9+\-\(\)\s]', '', 'g');
      -- Basic phone validation
      IF length(regexp_replace(sanitized_input, '[^0-9]', '', 'g')) < 10 OR 
         length(regexp_replace(sanitized_input, '[^0-9]', '', 'g')) > 15 THEN
        is_valid := false;
        errors := array_append(errors, 'Phone number must be 10-15 digits');
      END IF;
    WHEN 'numeric' THEN
      IF NOT sanitized_input ~ '^[0-9]+(\.[0-9]+)?$' THEN
        is_valid := false;
        errors := array_append(errors, 'Must be a valid number');
      END IF;
    WHEN 'url' THEN
      IF NOT sanitized_input ~ '^https?://[^\s/$.?#].[^\s]*$' THEN
        is_valid := false;
        errors := array_append(errors, 'Must be a valid URL');
      END IF;
  END CASE;
  
  -- SQL injection prevention (additional layer)
  IF sanitized_input ~* '(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+.+set|exec\s*\(|execute\s*\()' THEN
    is_valid := false;
    errors := array_append(errors, 'Invalid characters detected');
    -- Log potential SQL injection attempt
    INSERT INTO public.security_events (event_type, severity, details)
    VALUES ('sql_injection_attempt', 'critical', jsonb_build_object('input', left(p_input, 100)));
  END IF;
  
  RETURN jsonb_build_object(
    'valid', is_valid,
    'sanitized', CASE WHEN is_valid THEN sanitized_input ELSE NULL END,
    'errors', errors
  );
END;
$$;

-- 5. Create CSP (Content Security Policy) configuration table
CREATE TABLE IF NOT EXISTS public.security_headers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  header_name text NOT NULL,
  header_value text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default CSP headers
INSERT INTO public.security_headers (header_name, header_value) VALUES
('Content-Security-Policy', 'default-src ''self''; script-src ''self'' ''unsafe-inline''; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https:; font-src ''self''; connect-src ''self'' https://gshxxsniwytjgcnthyfq.supabase.co;'),
('X-Content-Type-Options', 'nosniff'),
('X-Frame-Options', 'DENY'),
('X-XSS-Protection', '1; mode=block'),
('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'),
('Referrer-Policy', 'strict-origin-when-cross-origin')
ON CONFLICT DO NOTHING;

-- Enable RLS for security headers
ALTER TABLE public.security_headers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage security headers" ON public.security_headers FOR ALL USING (has_role('admin'::user_role));
CREATE POLICY "All users can view security headers" ON public.security_headers FOR SELECT USING (true);