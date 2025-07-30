-- Add RLS policy to allow admins to view all clients
CREATE POLICY "Admins can view all clients" 
ON public.clients 
FOR SELECT 
USING (has_role('admin'::user_role));

-- Add RLS policy to allow admins to update all clients
CREATE POLICY "Admins can update all clients" 
ON public.clients 
FOR UPDATE 
USING (has_role('admin'::user_role));

-- Add RLS policy to allow admins to delete all clients
CREATE POLICY "Admins can delete all clients" 
ON public.clients 
FOR DELETE 
USING (has_role('admin'::user_role));