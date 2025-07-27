-- Enhanced security features for super secure CRM

-- 1. Failed login attempts tracking
CREATE TABLE public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view failed attempts
CREATE POLICY "Admins can view failed login attempts" 
ON public.failed_login_attempts 
FOR SELECT 
USING (has_role('admin'::user_role));

-- System can insert failed attempts
CREATE POLICY "System can insert failed login attempts" 
ON public.failed_login_attempts 
FOR INSERT 
WITH CHECK (true);

-- 2. Security events table for monitoring
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all security events
CREATE POLICY "Admins can view all security events" 
ON public.security_events 
FOR SELECT 
USING (has_role('admin'::user_role));

-- System can insert security events
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- 3. Account lockout tracking
CREATE TABLE public.account_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unlock_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  reason TEXT NOT NULL,
  locked_by_system BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Admins can manage lockouts
CREATE POLICY "Admins can manage account lockouts" 
ON public.account_lockouts 
FOR ALL 
USING (has_role('admin'::user_role));

-- System can insert lockouts
CREATE POLICY "System can insert account lockouts" 
ON public.account_lockouts 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own lockouts
CREATE POLICY "Users can view their own lockouts" 
ON public.account_lockouts 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Security configuration table
CREATE TABLE public.security_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security config
CREATE POLICY "Admins can manage security config" 
ON public.security_config 
FOR ALL 
USING (has_role('admin'::user_role));

-- Insert default security settings
INSERT INTO public.security_config (key, value, description) VALUES
('max_failed_attempts', '5', 'Maximum failed login attempts before account lockout'),
('lockout_duration', '30', 'Account lockout duration in minutes'),
('session_timeout', '60', 'Session timeout in minutes'),
('password_min_length', '12', 'Minimum password length'),
('require_mfa', 'false', 'Require multi-factor authentication'),
('max_sessions_per_user', '3', 'Maximum concurrent sessions per user');

-- 5. Enhanced security functions

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_lockouts 
    WHERE email = user_email 
    AND is_active = true 
    AND unlock_at > now()
  );
$$;

-- Function to get failed login count in last hour
CREATE OR REPLACE FUNCTION public.get_recent_failed_attempts(user_email TEXT)
RETURNS INTEGER
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.failed_login_attempts 
  WHERE email = user_email 
  AND attempt_time > (now() - INTERVAL '1 hour');
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium',
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.security_events (
        user_id, event_type, severity, details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_event_type, p_severity, p_details, p_ip_address, p_user_agent
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Function to lock account
CREATE OR REPLACE FUNCTION public.lock_account(
  user_email TEXT,
  lock_reason TEXT DEFAULT 'Exceeded failed login attempts'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    lockout_id UUID;
    user_uuid UUID;
BEGIN
    -- Get user ID from email
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    INSERT INTO public.account_lockouts (
        user_id, email, reason
    ) VALUES (
        user_uuid, user_email, lock_reason
    ) RETURNING id INTO lockout_id;
    
    -- Log security event
    PERFORM public.log_security_event(
        user_uuid,
        'account_locked',
        'high',
        jsonb_build_object('reason', lock_reason, 'email', user_email)
    );
    
    RETURN lockout_id;
END;
$$;

-- 6. Indexes for performance
CREATE INDEX idx_failed_login_attempts_email_time ON public.failed_login_attempts(email, attempt_time);
CREATE INDEX idx_security_events_user_id_time ON public.security_events(user_id, created_at);
CREATE INDEX idx_account_lockouts_email_active ON public.account_lockouts(email, is_active, unlock_at);
CREATE INDEX idx_user_sessions_user_id_active ON public.user_sessions(user_id, is_active, expires_at);

-- 7. Update existing audit logs for better security tracking
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

-- 8. Trigger to update updated_at on security config
CREATE TRIGGER update_security_config_updated_at
BEFORE UPDATE ON public.security_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();