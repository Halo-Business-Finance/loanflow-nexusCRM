-- Just create the table structure without the function or role assignment for now
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Temporarily disable RLS to insert the super_admin role
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Assign super_admin role to the current user
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('7c269c97-764b-4756-98a0-17ccc4df9fb8', 'super_admin', true)
ON CONFLICT (user_id, role) 
DO UPDATE SET is_active = true;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;