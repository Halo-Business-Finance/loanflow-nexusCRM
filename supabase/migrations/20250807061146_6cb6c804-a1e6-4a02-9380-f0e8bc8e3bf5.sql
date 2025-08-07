-- Fix Critical Privilege Escalation Vulnerability in user_roles RLS policies
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can create non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can create their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own user roles" ON public.user_roles;

-- Create secure replacement policies that prevent privilege escalation
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role('admin'::user_role));

CREATE POLICY "Admins can create non-admin roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role('admin'::user_role) 
  AND role != 'super_admin'::user_role
);

CREATE POLICY "Admins can update non-admin roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role('admin'::user_role) 
  AND role != 'super_admin'::user_role
);

CREATE POLICY "Admins can delete non-admin roles" 
ON public.user_roles 
FOR DELETE 
USING (
  has_role('admin'::user_role) 
  AND role != 'super_admin'::user_role
);

-- Super admins have full control
CREATE POLICY "Super admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (has_role('super_admin'::user_role))
WITH CHECK (has_role('super_admin'::user_role));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Log security policy update
INSERT INTO public.audit_logs (action, table_name, new_values)
VALUES (
  'security_policy_update', 
  'user_roles',
  jsonb_build_object(
    'action', 'privilege_escalation_fix',
    'description', 'Prevented admin privilege escalation to super_admin',
    'timestamp', now()
  )
);