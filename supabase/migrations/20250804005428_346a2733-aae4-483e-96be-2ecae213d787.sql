-- Update the lead-documents bucket to be public for file access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'lead-documents';

-- Create comprehensive RLS policies for the lead-documents bucket
-- Users can view files they own
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload files to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can manage all files
CREATE POLICY "Admins can manage all files" ON storage.objects
FOR ALL 
USING (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);