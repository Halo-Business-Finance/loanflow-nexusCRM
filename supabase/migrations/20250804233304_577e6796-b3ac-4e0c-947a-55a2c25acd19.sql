-- Update RLS policies for lead_documents table to allow all authenticated users to access all records

-- First, check if lead_documents table exists and update its policies
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_documents') THEN
        -- Drop existing restrictive policies
        DROP POLICY IF EXISTS "Users can view their own lead documents" ON public.lead_documents;
        DROP POLICY IF EXISTS "Users can update their own lead documents" ON public.lead_documents;
        DROP POLICY IF EXISTS "Users can delete their own lead documents" ON public.lead_documents;
        DROP POLICY IF EXISTS "Users can create their own lead documents" ON public.lead_documents;
        DROP POLICY IF EXISTS "Users can view documents for their leads" ON public.lead_documents;
        DROP POLICY IF EXISTS "Users can create documents for their leads" ON public.lead_documents;
        DROP POLICY IF EXISTS "Users can update documents for their leads" ON public.lead_documents;
        DROP POLICY IF EXISTS "Users can delete documents for their leads" ON public.lead_documents;
        
        -- Create new policies allowing all authenticated users to access all lead documents
        CREATE POLICY "All authenticated users can view lead documents" 
        ON public.lead_documents 
        FOR SELECT 
        TO authenticated
        USING (true);
        
        CREATE POLICY "All authenticated users can insert lead documents" 
        ON public.lead_documents 
        FOR INSERT 
        TO authenticated
        WITH CHECK (true);
        
        CREATE POLICY "All authenticated users can update lead documents" 
        ON public.lead_documents 
        FOR UPDATE 
        TO authenticated
        USING (true);
        
        CREATE POLICY "All authenticated users can delete lead documents" 
        ON public.lead_documents 
        FOR DELETE 
        TO authenticated
        USING (true);
    END IF;
END $$;

-- Update storage policies for lead-documents bucket to allow all authenticated users
DO $$
BEGIN
    -- Drop existing restrictive storage policies
    DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
    
    -- Create new storage policies allowing all authenticated users to access lead documents
    CREATE POLICY "All authenticated users can view lead documents in storage" 
    ON storage.objects 
    FOR SELECT 
    TO authenticated
    USING (bucket_id = 'lead-documents');
    
    CREATE POLICY "All authenticated users can upload lead documents to storage" 
    ON storage.objects 
    FOR INSERT 
    TO authenticated
    WITH CHECK (bucket_id = 'lead-documents');
    
    CREATE POLICY "All authenticated users can update lead documents in storage" 
    ON storage.objects 
    FOR UPDATE 
    TO authenticated
    USING (bucket_id = 'lead-documents');
    
    CREATE POLICY "All authenticated users can delete lead documents from storage" 
    ON storage.objects 
    FOR DELETE 
    TO authenticated
    USING (bucket_id = 'lead-documents');
END $$;