-- Create secure encryption functions for sensitive tokens
CREATE OR REPLACE FUNCTION public.encrypt_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  encrypted_result text;
BEGIN
  -- Use pgcrypto for symmetric encryption with a fixed key
  -- In production, this should use a proper key management system
  encrypted_result := encode(
    encrypt(p_token::bytea, 'your-secret-encryption-key-here'::bytea, 'aes'),
    'base64'
  );
  RETURN encrypted_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_token(p_encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  decrypted_result text;
BEGIN
  -- Decrypt the token
  decrypted_result := convert_from(
    decrypt(decode(p_encrypted_token, 'base64'), 'your-secret-encryption-key-here'::bytea, 'aes'),
    'UTF8'
  );
  RETURN decrypted_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return null if decryption fails
    RETURN NULL;
END;
$$;

-- Create secure token storage functions for active_sessions
CREATE OR REPLACE FUNCTION public.store_secure_session_token(
  p_user_id uuid,
  p_session_token text,
  p_device_fingerprint text,
  p_user_agent text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.active_sessions (
    user_id, 
    session_token, 
    device_fingerprint, 
    user_agent, 
    expires_at
  ) VALUES (
    p_user_id,
    public.encrypt_token(p_session_token),
    p_device_fingerprint,
    p_user_agent,
    now() + interval '8 hours'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_secure_session_token(
  p_user_id uuid,
  p_session_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  stored_encrypted_token text;
  decrypted_token text;
BEGIN
  -- Get the encrypted token from database
  SELECT session_token INTO stored_encrypted_token
  FROM public.active_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  LIMIT 1;
  
  IF stored_encrypted_token IS NULL THEN
    RETURN false;
  END IF;
  
  -- Decrypt and compare
  decrypted_token := public.decrypt_token(stored_encrypted_token);
  RETURN decrypted_token = p_session_token;
END;
$$;

-- Create secure email token storage functions
CREATE OR REPLACE FUNCTION public.store_secure_email_tokens(
  p_user_id uuid,
  p_email_address text,
  p_display_name text,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.email_accounts (
    user_id,
    email_address,
    display_name,
    access_token,
    refresh_token,
    expires_at
  ) VALUES (
    p_user_id,
    p_email_address,
    p_display_name,
    public.encrypt_token(p_access_token),
    public.encrypt_token(p_refresh_token),
    p_expires_at
  )
  ON CONFLICT (user_id, email_address) 
  DO UPDATE SET
    access_token = public.encrypt_token(p_access_token),
    refresh_token = public.encrypt_token(p_refresh_token),
    expires_at = p_expires_at,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_secure_email_tokens(
  p_user_id uuid,
  p_email_address text
)
RETURNS TABLE(
  decrypted_access_token text,
  decrypted_refresh_token text,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.decrypt_token(access_token) as decrypted_access_token,
    public.decrypt_token(refresh_token) as decrypted_refresh_token,
    email_accounts.expires_at
  FROM public.email_accounts
  WHERE user_id = p_user_id
    AND email_address = p_email_address
    AND is_active = true;
END;
$$;