-- Remove 'viewer' from user_role enum and add loan_originator
-- First, update any existing 'viewer' roles to 'tech'
UPDATE public.user_roles 
SET role = 'tech' 
WHERE role = 'viewer';

-- Create new enum with loan_originator and without viewer
CREATE TYPE public.user_role_new AS ENUM (
  'super_admin',
  'admin', 
  'manager',
  'agent',
  'loan_originator',
  'loan_processor',
  'underwriter',
  'funder',
  'closer',
  'tech'
);

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.user_role_new 
USING role::text::public.user_role_new;

-- Drop the old enum and rename the new one
DROP TYPE public.user_role;
ALTER TYPE public.user_role_new RENAME TO user_role;

-- Update the has_role function to use the new enum
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = $2 
        AND (
            role = $1 
            OR role = 'super_admin'  -- super_admin has access to everything
        )
        AND is_active = true
    );
$function$;