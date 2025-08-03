-- Check current user and update to super_admin role
-- First, let's see what roles exist for the current user
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Get user email for logging
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    
    -- Update or insert super_admin role for current user
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (current_user_id, 'super_admin'::user_role, true)
    ON CONFLICT (user_id, role) 
    DO UPDATE SET is_active = true, updated_at = now();
    
    -- Deactivate other roles for this user to avoid conflicts
    UPDATE public.user_roles 
    SET is_active = false, updated_at = now()
    WHERE user_id = current_user_id 
    AND role != 'super_admin'::user_role;
    
    -- Log this action
    INSERT INTO public.audit_logs (
        user_id, action, table_name, new_values
    ) VALUES (
        current_user_id, 
        'role_updated_to_super_admin', 
        'user_roles',
        jsonb_build_object('email', user_email, 'new_role', 'super_admin', 'timestamp', now())
    );
    
    RAISE NOTICE 'Successfully granted super_admin role to user: %', user_email;
END $$;