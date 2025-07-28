-- CRITICAL SECURITY FIX: Update RLS policies to be user-specific

-- Drop overly permissive policies for leads
DROP POLICY IF EXISTS "All authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can delete leads" ON public.leads;

-- Create secure user-specific policies for leads
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

-- Drop overly permissive policies for clients
DROP POLICY IF EXISTS "All authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated users can delete clients" ON public.clients;

-- Create secure user-specific policies for clients
CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop overly permissive policies for loans
DROP POLICY IF EXISTS "All authenticated users can view all loans" ON public.loans;
DROP POLICY IF EXISTS "All authenticated users can update loans" ON public.loans;
DROP POLICY IF EXISTS "All authenticated users can delete loans" ON public.loans;

-- Create secure user-specific policies for loans
CREATE POLICY "Users can view their own loans" 
ON public.loans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" 
ON public.loans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans" 
ON public.loans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop overly permissive policies for pipeline entries
DROP POLICY IF EXISTS "All authenticated users can view all pipeline entries" ON public.pipeline_entries;
DROP POLICY IF EXISTS "All authenticated users can update pipeline entries" ON public.pipeline_entries;
DROP POLICY IF EXISTS "All authenticated users can delete pipeline entries" ON public.pipeline_entries;

-- Create secure user-specific policies for pipeline entries
CREATE POLICY "Users can view their own pipeline entries" 
ON public.pipeline_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline entries" 
ON public.pipeline_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipeline entries" 
ON public.pipeline_entries 
FOR DELETE 
USING (auth.uid() = user_id);