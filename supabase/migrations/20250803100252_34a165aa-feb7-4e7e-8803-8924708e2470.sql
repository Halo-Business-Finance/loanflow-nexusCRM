-- Reactivate Rebecca's admin role
UPDATE public.user_roles 
SET is_active = true,
    updated_at = now()
WHERE user_id = 'ad0bf557-ff9f-47a5-8485-36072941d289'
AND role = 'admin';

-- Log the restoration action
INSERT INTO public.audit_logs (
    action, table_name, record_id, new_values
) VALUES (
    'user_role_reactivated',
    'user_roles',
    'ad0bf557-ff9f-47a5-8485-36072941d289',
    jsonb_build_object('role', 'admin', 'reactivated_at', now())
);