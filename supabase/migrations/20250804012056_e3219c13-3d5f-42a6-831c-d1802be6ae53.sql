-- First, let's see what user_role enum values exist
-- Insert super_admin role for the most recent user (Dave)
INSERT INTO public.user_roles (user_id, role, assigned_by) 
VALUES ('b260a720-fb96-45b7-9546-8362968ee36a', 'super_admin', 'b260a720-fb96-45b7-9546-8362968ee36a')
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  is_active = true,
  updated_at = now();