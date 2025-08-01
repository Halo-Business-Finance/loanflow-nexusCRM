-- Update underwriter storage policies to restrict access to Documentation and Closing stages only

-- Drop existing underwriter policies
DROP POLICY IF EXISTS "Underwriter can view files for qualified+ leads" ON storage.objects;
DROP POLICY IF EXISTS "Underwriter can upload files for qualified+ leads" ON storage.objects;
DROP POLICY IF EXISTS "Underwriter can update files for qualified+ leads" ON storage.objects;
DROP POLICY IF EXISTS "Underwriter can delete files for qualified+ leads" ON storage.objects;

-- Create new policies for Documentation to Closing stages only
CREATE POLICY "Underwriter can view files for documentation+ leads" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'hbf-bucket' 
  AND has_role('underwriter'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);

CREATE POLICY "Underwriter can upload files for documentation+ leads" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'hbf-bucket' 
  AND has_role('underwriter'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);

CREATE POLICY "Underwriter can update files for documentation+ leads" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'hbf-bucket' 
  AND has_role('underwriter'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);

CREATE POLICY "Underwriter can delete files for documentation+ leads" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'hbf-bucket' 
  AND has_role('underwriter'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);