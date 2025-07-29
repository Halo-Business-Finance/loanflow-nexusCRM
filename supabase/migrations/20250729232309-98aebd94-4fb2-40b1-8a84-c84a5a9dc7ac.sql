-- Create user_roles table and assign super_admin role
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur2 
        WHERE ur2.user_id = auth.uid() 
        AND ur2.role = 'super_admin'
        AND ur2.is_active = true
    )
);

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