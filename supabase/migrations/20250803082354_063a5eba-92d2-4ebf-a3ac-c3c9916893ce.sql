-- Add policy to allow all authenticated users to view all contact entities
-- This matches the leads table policy that allows universal access
CREATE POLICY "All authenticated users can view all contact entities" 
ON public.contact_entities 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Add policy to allow all authenticated users to update all contact entities
CREATE POLICY "All authenticated users can update all contact entities" 
ON public.contact_entities 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Add policy to allow all authenticated users to delete all contact entities  
CREATE POLICY "All authenticated users can delete all contact entities" 
ON public.contact_entities 
FOR DELETE 
USING (auth.role() = 'authenticated');