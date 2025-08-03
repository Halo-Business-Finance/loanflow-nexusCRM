-- Phase 2: Create secure session management functions
-- Create missing functions for secure session handling

-- 1. Create secure session data table for server-side storage
CREATE TABLE IF NOT EXISTS public.secure_session_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_key text NOT NULL,
  session_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '8 hours'),
  UNIQUE(user_id, session_key)
);

-- Enable RLS on secure session data
ALTER TABLE public.secure_session_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for secure session data
CREATE POLICY "Users can only access their own session data" 
ON public.secure_session_data 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Function to store secure session data
CREATE OR REPLACE FUNCTION public.store_secure_session_data(
  p_key text,
  p_value text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.secure_session_data (user_id, session_key, session_value)
  VALUES (auth.uid(), p_key, p_value)
  ON CONFLICT (user_id, session_key) 
  DO UPDATE SET 
    session_value = EXCLUDED.session_value,
    expires_at = now() + interval '8 hours';
END;
$function$;

-- 3. Function to get secure session data
CREATE OR REPLACE FUNCTION public.get_secure_session_data(
  p_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  session_value text;
BEGIN
  SELECT secure_session_data.session_value INTO session_value
  FROM public.secure_session_data
  WHERE user_id = auth.uid() 
  AND session_key = p_key 
  AND expires_at > now();
  
  RETURN session_value;
END;
$function$;

-- 4. Function to remove secure session data
CREATE OR REPLACE FUNCTION public.remove_secure_session_data(
  p_key text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.secure_session_data
  WHERE user_id = auth.uid() AND session_key = p_key;
END;
$function$;

-- 5. Function to clear all secure session data for user
CREATE OR REPLACE FUNCTION public.clear_secure_session_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.secure_session_data
  WHERE user_id = auth.uid();
END;
$function$;

-- 6. Function to create secure session
CREATE OR REPLACE FUNCTION public.create_secure_session(
  p_session_token text,
  p_device_fingerprint text,
  p_user_agent text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.active_sessions (
    user_id, session_token, device_fingerprint, user_agent, expires_at
  ) VALUES (
    auth.uid(), 
    p_session_token, 
    p_device_fingerprint, 
    p_user_agent,
    now() + interval '8 hours'
  );
END;
$function$;