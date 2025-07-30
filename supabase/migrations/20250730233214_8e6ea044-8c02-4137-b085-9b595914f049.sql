-- Update RLS policies to make leads universally accessible to all users

-- Drop the existing restrictive SELECT policy for users viewing only their own leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

-- Drop the existing restrictive UPDATE policy for users updating only their own leads  
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;

-- Drop the existing restrictive DELETE policy for users deleting only their own leads
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Create new universal policies for all authenticated users
CREATE POLICY "All authenticated users can view all leads" 
ON public.leads 
FOR SELECT 
USING (true);

CREATE POLICY "All authenticated users can update all leads" 
ON public.leads 
FOR UPDATE 
USING (true);

CREATE POLICY "All authenticated users can delete all leads" 
ON public.leads 
FOR DELETE 
USING (true);