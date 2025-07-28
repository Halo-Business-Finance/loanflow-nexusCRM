-- Update RLS policies to allow all users to view all CRM data

-- Drop existing restrictive policies for leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Create new policies for leads - allow all authenticated users to view all data
CREATE POLICY "All authenticated users can view all leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can update leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can delete leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

-- Create new policies for clients
CREATE POLICY "All authenticated users can view all clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create clients" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can delete clients" 
ON public.clients 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for loans
DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can create their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can delete their own loans" ON public.loans;

-- Create new policies for loans
CREATE POLICY "All authenticated users can view all loans" 
ON public.loans 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create loans" 
ON public.loans 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can update loans" 
ON public.loans 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can delete loans" 
ON public.loans 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for pipeline entries
DROP POLICY IF EXISTS "Users can view their own pipeline entries" ON public.pipeline_entries;
DROP POLICY IF EXISTS "Users can create their own pipeline entries" ON public.pipeline_entries;
DROP POLICY IF EXISTS "Users can update their own pipeline entries" ON public.pipeline_entries;
DROP POLICY IF EXISTS "Users can delete their own pipeline entries" ON public.pipeline_entries;

-- Create new policies for pipeline entries
CREATE POLICY "All authenticated users can view all pipeline entries" 
ON public.pipeline_entries 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create pipeline entries" 
ON public.pipeline_entries 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can update pipeline entries" 
ON public.pipeline_entries 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can delete pipeline entries" 
ON public.pipeline_entries 
FOR DELETE 
TO authenticated
USING (true);