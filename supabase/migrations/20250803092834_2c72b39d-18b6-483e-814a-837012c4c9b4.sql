-- Add archiving fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN archived_at timestamp with time zone,
ADD COLUMN archived_by uuid REFERENCES auth.users(id),
ADD COLUMN archive_reason text;

-- Add archiving fields to user_roles table  
ALTER TABLE public.user_roles
ADD COLUMN archived_at timestamp with time zone,
ADD COLUMN archived_by uuid REFERENCES auth.users(id),
ADD COLUMN archive_reason text;

-- Create function to archive user (soft delete)
CREATE OR REPLACE FUNCTION public.archive_user(
  p_user_id uuid,
  p_archived_by uuid DEFAULT auth.uid(),
  p_reason text DEFAULT 'User archived by administrator'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Archive the user profile
  UPDATE public.profiles 
  SET 
    archived_at = now(),
    archived_by = p_archived_by,
    archive_reason = p_reason,
    is_active = false
  WHERE id = p_user_id;

  -- Archive the user roles
  UPDATE public.user_roles 
  SET 
    archived_at = now(),
    archived_by = p_archived_by,
    archive_reason = p_reason,
    is_active = false
  WHERE user_id = p_user_id;

  -- Log the archive action
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, new_values
  ) VALUES (
    p_archived_by,
    'user_archived',
    'profiles',
    p_user_id::text,
    jsonb_build_object('archived_at', now(), 'reason', p_reason)
  );

  RETURN true;
END;
$$;

-- Create function to restore user from archive
CREATE OR REPLACE FUNCTION public.restore_user(
  p_user_id uuid,
  p_restored_by uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Restore the user profile
  UPDATE public.profiles 
  SET 
    archived_at = null,
    archived_by = null,
    archive_reason = null,
    is_active = true
  WHERE id = p_user_id;

  -- Restore the user roles
  UPDATE public.user_roles 
  SET 
    archived_at = null,
    archived_by = null,
    archive_reason = null,
    is_active = true
  WHERE user_id = p_user_id;

  -- Log the restore action
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, new_values
  ) VALUES (
    p_restored_by,
    'user_restored',
    'profiles',
    p_user_id::text,
    jsonb_build_object('restored_at', now())
  );

  RETURN true;
END;
$$;