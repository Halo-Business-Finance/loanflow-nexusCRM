-- Fix critical RLS policy issues

-- 1. Fix overly permissive leads policies
DROP POLICY IF EXISTS "All authenticated users can delete all leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can update all leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can view all leads" ON public.leads;

-- Create secure leads policies with proper user ownership checks
CREATE POLICY "Users can view their own leads" ON public.leads
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON public.leads
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON public.leads
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create leads" ON public.leads
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin override policies for leads
CREATE POLICY "Admins can manage all leads" ON public.leads
FOR ALL 
USING (has_role('admin'::user_role) OR has_role('super_admin'::user_role));

-- 2. Add session timeout configuration
CREATE TABLE IF NOT EXISTS public.session_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_timeout_minutes integer NOT NULL DEFAULT 30,
  max_concurrent_sessions integer NOT NULL DEFAULT 3,
  require_fresh_login_minutes integer NOT NULL DEFAULT 120,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on session config
ALTER TABLE public.session_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage session config
CREATE POLICY "Admins can manage session config" ON public.session_config
FOR ALL 
USING (has_role('admin'::user_role));

-- Insert default session configuration
INSERT INTO public.session_config (session_timeout_minutes, max_concurrent_sessions, require_fresh_login_minutes)
VALUES (30, 3, 120)
ON CONFLICT DO NOTHING;

-- 3. Create enhanced session monitoring
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  device_fingerprint text,
  ip_address inet,
  user_agent text,
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on active sessions
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions" ON public.active_sessions
FOR SELECT 
USING (auth.uid() = user_id);

-- System can manage all sessions
CREATE POLICY "System can manage sessions" ON public.active_sessions
FOR ALL 
USING (true);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON public.active_sessions
FOR SELECT 
USING (has_role('admin'::user_role));

-- 4. Create function to validate session security
CREATE OR REPLACE FUNCTION public.validate_session_security(p_user_id uuid, p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
  config_record RECORD;
  is_valid boolean := false;
  reason text := 'Session validation failed';
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
        is_valid := true;
        reason := 'Session valid';
        
        -- Update last activity
        UPDATE public.active_sessions 
        SET last_activity = now()
        WHERE id = session_record.id;
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
  
  RETURN jsonb_build_object(
    'valid', is_valid,
    'reason', reason,
    'requires_reauth', NOT is_valid
  );
END;
$$;

-- 5. Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete sessions that have been inactive for more than 24 hours
  DELETE FROM public.active_sessions 
  WHERE last_activity < (now() - INTERVAL '24 hours') 
    OR expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup action
  INSERT INTO public.audit_logs (
    action, table_name, new_values
  ) VALUES (
    'session_cleanup', 'active_sessions',
    jsonb_build_object('deleted_sessions', deleted_count, 'timestamp', now())
  );
  
  RETURN deleted_count;
END;
$$;

-- 6. Create enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(
  p_input text,
  p_field_type text DEFAULT 'text',
  p_max_length integer DEFAULT 255,
  p_allow_html boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  sanitized_input text;
  is_valid boolean := true;
  errors text[] := '{}';
BEGIN
  -- Basic sanitization
  sanitized_input := trim(p_input);
  
  -- Length validation
  IF length(sanitized_input) > p_max_length THEN
    is_valid := false;
    errors := array_append(errors, 'Input exceeds maximum length of ' || p_max_length);
  END IF;
  
  -- Field type specific validation
  CASE p_field_type
    WHEN 'email' THEN
      IF NOT sanitized_input ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        is_valid := false;
        errors := array_append(errors, 'Invalid email format');
      END IF;
    WHEN 'phone' THEN
      -- Remove all non-digits
      sanitized_input := regexp_replace(sanitized_input, '[^0-9]', '', 'g');
      IF length(sanitized_input) < 10 OR length(sanitized_input) > 15 THEN
        is_valid := false;
        errors := array_append(errors, 'Phone number must be 10-15 digits');
      END IF;
    WHEN 'numeric' THEN
      IF NOT sanitized_input ~ '^[0-9]+(\.[0-9]+)?$' THEN
        is_valid := false;
        errors := array_append(errors, 'Must be a valid number');
      END IF;
    WHEN 'text' THEN
      -- Remove potential XSS patterns if HTML not allowed
      IF NOT p_allow_html THEN
        sanitized_input := regexp_replace(sanitized_input, '<[^>]*>', '', 'g');
        sanitized_input := regexp_replace(sanitized_input, '(javascript|vbscript|onload|onerror|onclick)', '', 'gi');
      END IF;
  END CASE;
  
  -- SQL injection prevention
  sanitized_input := replace(sanitized_input, '''', '''''');
  
  RETURN jsonb_build_object(
    'valid', is_valid,
    'sanitized', sanitized_input,
    'errors', errors
  );
END;
$$;