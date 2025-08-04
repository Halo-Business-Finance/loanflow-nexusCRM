-- Update Varda's role to super_admin
UPDATE public.user_roles 
SET role = 'super_admin'
WHERE user_id = '7c269c97-764b-4756-98a0-17ccc4df9fb8';