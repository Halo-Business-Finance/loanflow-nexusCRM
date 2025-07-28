-- Update RLS policies to create shared data access for all authenticated users

-- Update clients table policies
DROP POLICY IF EXISTS "All authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated users can delete clients" ON public.clients;

CREATE POLICY "All authenticated users can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "All authenticated users can update clients" 
ON public.clients 
FOR UPDATE 
USING (true);

CREATE POLICY "All authenticated users can delete clients" 
ON public.clients 
FOR DELETE 
USING (true);

-- Update leads table policies
DROP POLICY IF EXISTS "All authenticated users can create leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "All authenticated users can delete leads" ON public.leads;

CREATE POLICY "All authenticated users can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "All authenticated users can update leads" 
ON public.leads 
FOR UPDATE 
USING (true);

CREATE POLICY "All authenticated users can delete leads" 
ON public.leads 
FOR DELETE 
USING (true);

-- Update loans table policies
DROP POLICY IF EXISTS "All authenticated users can create loans" ON public.loans;
DROP POLICY IF EXISTS "All authenticated users can update loans" ON public.loans;
DROP POLICY IF EXISTS "All authenticated users can delete loans" ON public.loans;

CREATE POLICY "All authenticated users can create loans" 
ON public.loans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "All authenticated users can update loans" 
ON public.loans 
FOR UPDATE 
USING (true);

CREATE POLICY "All authenticated users can delete loans" 
ON public.loans 
FOR DELETE 
USING (true);

-- Update pipeline_entries table policies
DROP POLICY IF EXISTS "All authenticated users can create pipeline entries" ON public.pipeline_entries;
DROP POLICY IF EXISTS "All authenticated users can update pipeline entries" ON public.pipeline_entries;
DROP POLICY IF EXISTS "All authenticated users can delete pipeline entries" ON public.pipeline_entries;

CREATE POLICY "All authenticated users can create pipeline entries" 
ON public.pipeline_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "All authenticated users can update pipeline entries" 
ON public.pipeline_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "All authenticated users can delete pipeline entries" 
ON public.pipeline_entries 
FOR DELETE 
USING (true);