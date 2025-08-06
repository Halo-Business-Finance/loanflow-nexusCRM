-- Critical Security Fix: Replace overly permissive RLS policies with proper user-based access controls

-- Fix contact_entities table RLS policies
DROP POLICY IF EXISTS "All authenticated users can delete contact entities" ON public.contact_entities;
DROP POLICY IF EXISTS "All authenticated users can update contact entities" ON public.contact_entities;
DROP POLICY IF EXISTS "All authenticated users can view contact entities" ON public.contact_entities;

-- Create proper user-scoped RLS policies for contact_entities
CREATE POLICY "Users can view their own contact entities" 
ON public.contact_entities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact entities" 
ON public.contact_entities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact entities" 
ON public.contact_entities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix clients table RLS policies
DROP POLICY IF EXISTS "All authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated users can view clients" ON public.clients;

-- Create proper user-scoped RLS policies for clients
CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create clients for themselves" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix leads table RLS policies - CRITICAL security issue
DROP POLICY IF EXISTS "All authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can delete leads" ON public.leads;

-- Create proper user-scoped RLS policies for leads
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add admin override policies for management access
CREATE POLICY "Admins can manage all contact entities" 
ON public.contact_entities 
FOR ALL 
USING (has_role('admin'::user_role) OR has_role('super_admin'::user_role));

CREATE POLICY "Admins can manage all clients" 
ON public.clients 
FOR ALL 
USING (has_role('admin'::user_role) OR has_role('super_admin'::user_role));

CREATE POLICY "Admins can manage all leads" 
ON public.leads 
FOR ALL 
USING (has_role('admin'::user_role) OR has_role('super_admin'::user_role));

-- Add manager policies for team oversight
CREATE POLICY "Managers can view team contact entities" 
ON public.contact_entities 
FOR SELECT 
USING (has_role('manager'::user_role));

CREATE POLICY "Managers can view team clients" 
ON public.clients 
FOR SELECT 
USING (has_role('manager'::user_role));

CREATE POLICY "Managers can view team leads" 
ON public.leads 
FOR SELECT 
USING (has_role('manager'::user_role));