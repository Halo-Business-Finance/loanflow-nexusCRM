-- Fix user_role enum to match the code requirements
-- Remove 'viewer' and add 'loan_originator' and 'tech'

-- First, update any existing 'viewer' roles to 'tech'
UPDATE public.user_roles 
SET role = 'tech'::user_role 
WHERE role = 'viewer'::user_role;

-- Create the new enum with the correct values
CREATE TYPE public.user_role_new AS ENUM (
  'super_admin',
  'admin', 
  'manager',
  'agent',
  'loan_originator',
  'loan_processor',
  'funder',
  'underwriter',
  'closer',
  'tech'
);

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.user_role_new 
USING role::text::public.user_role_new;

-- Update the has_role function to use the new enum
DROP FUNCTION IF EXISTS public.has_role(text, uuid);
DROP FUNCTION IF EXISTS public.has_role(user_role, uuid);

-- Recreate the has_role function with the new enum
CREATE OR REPLACE FUNCTION public.has_role(required_role text, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = $2 
        AND (
            role::text = $1 
            OR role::text = 'super_admin'  -- super_admin has access to everything
        )
        AND is_active = true
    );
$function$;

-- Drop the old enum and rename the new one
DROP TYPE public.user_role;
ALTER TYPE public.user_role_new RENAME TO user_role;