-- Fix user_role enum by updating default and handling the constraint
-- First, remove the default constraint temporarily
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Update any existing 'viewer' roles to 'tech'
UPDATE public.user_roles 
SET role = 'tech'::user_role 
WHERE role = 'viewer'::user_role;

-- Add 'loan_originator' and 'tech' to the enum, remove 'viewer'
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'loan_originator';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tech';

-- We can't remove enum values directly, so we need to recreate the enum
-- Create the new enum with correct values
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

-- Update the user_roles table column type
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.user_role_new 
USING role::text::public.user_role_new;

-- Drop old functions first
DROP FUNCTION IF EXISTS public.has_role(text, uuid);
DROP FUNCTION IF EXISTS public.has_role(user_role, uuid);

-- Drop the old enum
DROP TYPE public.user_role;

-- Rename the new enum
ALTER TYPE public.user_role_new RENAME TO user_role;

-- Recreate the has_role function
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