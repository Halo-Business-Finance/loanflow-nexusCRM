-- Create the user_role enum type that's missing
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'agent', 'viewer');

-- Update the user_roles table to use the enum type properly
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE user_role USING role::text::user_role;