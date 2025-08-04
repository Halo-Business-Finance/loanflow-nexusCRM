-- First, update any existing 'viewer' roles to 'tech'
UPDATE public.user_roles 
SET role = 'tech' 
WHERE role = 'viewer';

-- Update the user role enum to include loan_originator and remove viewer
-- We need to do this step by step to avoid casting issues

-- Step 1: Add loan_originator to the enum
ALTER TYPE public.user_role ADD VALUE 'loan_originator';

-- Step 2: Remove the default value constraint temporarily
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Step 3: We cannot remove enum values directly in PostgreSQL
-- Instead, we'll create a new enum and migrate

-- Create new enum without viewer
CREATE TYPE public.user_role_temp AS ENUM (
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

-- Convert existing data to temp enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.user_role_temp 
USING (CASE 
  WHEN role::text = 'viewer' THEN 'tech'::public.user_role_temp
  ELSE role::text::public.user_role_temp 
END);

-- Drop old enum and rename new one
DROP TYPE public.user_role CASCADE;
ALTER TYPE public.user_role_temp RENAME TO user_role;

-- Restore default value
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'agent'::public.user_role;

-- Recreate the has_role function since CASCADE dropped it
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