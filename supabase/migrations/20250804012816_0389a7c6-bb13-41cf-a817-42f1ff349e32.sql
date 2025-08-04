-- Check and update storage policies for lead-documents bucket
-- First, let's see existing policies
-- DROP any restrictive policies and create permissive ones for the lead-documents bucket

-- Create very permissive policies for lead-documents bucket to allow access
DROP POLICY IF EXISTS "Public read access for lead-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to lead-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their lead-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their lead-documents" ON storage.objects;

-- Create new permissive policies for lead-documents bucket
CREATE POLICY "Public read access for lead-documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'lead-documents');

CREATE POLICY "Users can upload to lead-documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'lead-documents');

CREATE POLICY "Users can update their lead-documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'lead-documents');

CREATE POLICY "Users can delete their lead-documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'lead-documents');