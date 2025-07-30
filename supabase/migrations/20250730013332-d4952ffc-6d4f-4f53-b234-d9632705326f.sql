-- Create missing profile for William
INSERT INTO public.profiles (id, first_name, last_name, email, phone_number)
VALUES (
  '722f2f47-da2d-48d7-8041-2fb2a39fa229',
  'William',
  '',
  'william@hbffund.com',
  NULL
);

-- Also ensure he has a user role (he already has admin role based on earlier data)
-- This will skip if role already exists due to unique constraint
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('722f2f47-da2d-48d7-8041-2fb2a39fa229', 'admin', true)
ON CONFLICT (user_id, role) DO NOTHING;