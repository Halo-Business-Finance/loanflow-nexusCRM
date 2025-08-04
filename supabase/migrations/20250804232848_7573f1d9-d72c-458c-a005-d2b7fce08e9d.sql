-- Update RLS policies for clients table to allow all authenticated users to access all records

-- Drop existing restrictive policies for regular users
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

-- Create new policies allowing all authenticated users to access all clients
CREATE POLICY "All authenticated users can view clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (true);

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