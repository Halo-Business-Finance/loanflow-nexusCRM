-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

-- Create new comprehensive RLS policies for leads
-- 1. Admins can view all leads
CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
USING (has_role('admin'::user_role));

-- 2. Managers can view all leads (shared visibility for now, can be restricted to teams later)
CREATE POLICY "Managers can view all leads" 
ON public.leads 
FOR SELECT 
USING (has_role('manager'::user_role));

-- 3. All authenticated users can view all leads (shared visibility)
CREATE POLICY "All users can view all leads" 
ON public.leads 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update INSERT policy to allow all authenticated users to create leads
DROP POLICY IF EXISTS "All authenticated users can create leads" ON public.leads;
CREATE POLICY "All authenticated users can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Update UPDATE policies based on roles
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;

-- Admins can update all leads
CREATE POLICY "Admins can update all leads" 
ON public.leads 
FOR UPDATE 
USING (has_role('admin'::user_role));

-- Managers can update all leads
CREATE POLICY "Managers can update all leads" 
ON public.leads 
FOR UPDATE 
USING (has_role('manager'::user_role));

-- Users can update leads they created
CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update DELETE policies based on roles
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Admins can delete all leads
CREATE POLICY "Admins can delete all leads" 
ON public.leads 
FOR DELETE 
USING (has_role('admin'::user_role));

-- Managers can delete all leads
CREATE POLICY "Managers can delete all leads" 
ON public.leads 
FOR DELETE 
USING (has_role('manager'::user_role));

-- Users can delete leads they created
CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add a manager role to the user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'manager') THEN
        ALTER TYPE user_role ADD VALUE 'manager';
    END IF;
END $$;