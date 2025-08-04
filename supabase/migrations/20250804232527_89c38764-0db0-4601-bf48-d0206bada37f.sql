-- Update RLS policies for contact_entities to allow all authenticated users to access all records
DROP POLICY IF EXISTS "Users can view their own contact entities" ON public.contact_entities;
DROP POLICY IF EXISTS "Users can update their own contact entities" ON public.contact_entities;
DROP POLICY IF EXISTS "Users can delete their own contact entities" ON public.contact_entities;

-- Create new policies allowing all authenticated users to access all contact entities
CREATE POLICY "All authenticated users can view contact entities" 
ON public.contact_entities 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can update contact entities" 
ON public.contact_entities 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can delete contact entities" 
ON public.contact_entities 
FOR DELETE 
TO authenticated
USING (true);

-- Update RLS policies for leads table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        -- Drop existing restrictive policies
        DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
        DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
        DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
        
        -- Create new policies allowing all authenticated users to access all leads
        CREATE POLICY "All authenticated users can view leads" 
        ON public.leads 
        FOR SELECT 
        TO authenticated
        USING (true);
        
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
    END IF;
END $$;