-- Create the user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('agent', 'manager', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN
        -- If enum exists, add super_admin if not already there
        BEGIN
            ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
END $$;

-- Update the has_role function to handle super_admin hierarchy
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
            OR role = 'super_admin'::user_role  -- super_admin has access to everything
        )
        AND is_active = true
    );
$function$;

-- Assign super_admin role to the current user (varda@halobusinessfinance.com)
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('7c269c97-764b-4756-98a0-17ccc4df9fb8', 'super_admin', true)
ON CONFLICT (user_id, role) 
DO UPDATE SET is_active = true;