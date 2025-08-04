-- Update the existing user role to super_admin instead of inserting a new one
UPDATE public.user_roles 
SET 
  role = 'super_admin',
  updated_at = now()
WHERE user_id = 'b260a720-fb96-45b7-9546-8362968ee36a' 
  AND is_active = true;