-- Allow super admin to view all leads
CREATE POLICY "Super admins can view all leads" 
ON public.leads 
FOR SELECT 
USING (has_role('super_admin'::user_role));

-- Allow super admin to manage all leads
CREATE POLICY "Super admins can manage all leads" 
ON public.leads 
FOR ALL 
USING (has_role('super_admin'::user_role));

-- Allow super admin to view all contact entities
CREATE POLICY "Super admins can view all contact entities" 
ON public.contact_entities 
FOR SELECT 
USING (has_role('super_admin'::user_role));

-- Allow super admin to manage all contact entities
CREATE POLICY "Super admins can manage all contact entities" 
ON public.contact_entities 
FOR ALL 
USING (has_role('super_admin'::user_role));

-- Allow super admin to view all user roles
CREATE POLICY "Super admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role('super_admin'::user_role));

-- Allow super admin to manage all user roles
CREATE POLICY "Super admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (has_role('super_admin'::user_role));

-- Allow super admin to view all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role('super_admin'::user_role));

-- Allow super admin to manage all profiles
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (has_role('super_admin'::user_role));