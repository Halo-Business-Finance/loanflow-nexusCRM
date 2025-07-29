-- Grant admin role to current user to fix 403 errors
INSERT INTO public.user_roles (user_id, role) 
VALUES ('7c269c97-764b-4756-98a0-17ccc4df9fb8', 'admin'::public.user_role)
ON CONFLICT (user_id, role) DO NOTHING;