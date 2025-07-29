-- Update RLS policies on profiles table to use the correct has_role function signature
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role('admin', auth.uid()) OR public.has_role('super_admin', auth.uid()));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role('admin', auth.uid()) OR public.has_role('super_admin', auth.uid()));

DROP POLICY IF EXISTS "Managers can view team profiles" ON public.profiles;
CREATE POLICY "Managers can view team profiles"
ON public.profiles
FOR SELECT
USING (public.has_role('manager', auth.uid()) OR public.has_role('admin', auth.uid()) OR public.has_role('super_admin', auth.uid()));