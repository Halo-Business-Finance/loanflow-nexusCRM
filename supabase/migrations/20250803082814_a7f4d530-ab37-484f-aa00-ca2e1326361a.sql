-- Grant super_admin role to the most recent user (likely you)
-- We'll grant it to the user with email that matches common admin patterns

DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT;
BEGIN
    -- Find the most likely admin user (varda@halobusinessfinance.com seems to be the main user)
    SELECT id, email INTO target_user_id, target_email 
    FROM auth.users 
    WHERE email LIKE '%@halobusinessfinance.com' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF target_user_id IS NOT NULL THEN
        -- Insert or update super_admin role
        INSERT INTO public.user_roles (user_id, role, is_active)
        VALUES (target_user_id, 'super_admin'::user_role, true)
        ON CONFLICT (user_id, role) 
        DO UPDATE SET is_active = true, updated_at = now();
        
        -- Deactivate other roles for this user
        UPDATE public.user_roles 
        SET is_active = false, updated_at = now()
        WHERE user_id = target_user_id 
        AND role != 'super_admin'::user_role;
        
        -- Log this action
        INSERT INTO public.audit_logs (
            user_id, action, table_name, new_values
        ) VALUES (
            target_user_id, 
            'role_updated_to_super_admin', 
            'user_roles',
            jsonb_build_object('email', target_email, 'new_role', 'super_admin', 'timestamp', now())
        );
        
        RAISE NOTICE 'Successfully granted super_admin role to: %', target_email;
    ELSE
        RAISE EXCEPTION 'No suitable user found for super_admin role assignment';
    END IF;
END $$;