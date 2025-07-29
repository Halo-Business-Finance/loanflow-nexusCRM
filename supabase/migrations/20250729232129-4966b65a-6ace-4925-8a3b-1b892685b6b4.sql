-- Create user_role enum (or add super_admin if it exists)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('agent', 'manager', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN
        -- If enum exists, try to add super_admin
        BEGIN
            ALTER TYPE public.user_role ADD VALUE 'super_admin';
        EXCEPTION
            WHEN others THEN null; -- super_admin might already exist
        END;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create the has_role function
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

-- Assign super_admin role to the current user
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('7c269c97-764b-4756-98a0-17ccc4df9fb8', 'super_admin', true)
ON CONFLICT (user_id, role) 
DO UPDATE SET is_active = true;