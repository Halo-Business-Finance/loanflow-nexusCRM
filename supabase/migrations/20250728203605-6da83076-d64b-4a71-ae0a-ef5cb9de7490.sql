-- First, let's ensure the user_role type definitely exists
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'agent', 'viewer');

-- Recreate the user_roles table to ensure it uses the proper enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Completely recreate the handle_new_user function with proper type casting
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  
  -- Create a default user role with explicit casting
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agent'::public.user_role);
  
  RETURN NEW;
END;
$function$;

-- Drop and recreate the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also recreate the role-related functions
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS public.user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT role FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND is_active = true 
    LIMIT 1;
$function$;

DROP FUNCTION IF EXISTS public.has_role(public.user_role, uuid);
CREATE OR REPLACE FUNCTION public.has_role(required_role public.user_role, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = $2 
        AND role = $1 
        AND is_active = true
    );
$function$;