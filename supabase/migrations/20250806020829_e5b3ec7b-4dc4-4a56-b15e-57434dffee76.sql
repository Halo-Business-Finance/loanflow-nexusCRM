-- Critical Security Fix Part 2: Fix leads table RLS policies
-- This addresses the most critical security vulnerability - open access to all leads data

-- Drop any overly permissive leads table policies
DROP POLICY IF EXISTS "All authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can create leads" ON public.leads;

-- Create proper user-scoped RLS policies for leads
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create leads for themselves" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add admin override policies for leads management
CREATE POLICY "Admins can manage all leads" 
ON public.leads 
FOR ALL 
USING (has_role('admin'::user_role) OR has_role('super_admin'::user_role));

-- Add manager policies for team oversight of leads
CREATE POLICY "Managers can view team leads" 
ON public.leads 
FOR SELECT 
USING (has_role('manager'::user_role));