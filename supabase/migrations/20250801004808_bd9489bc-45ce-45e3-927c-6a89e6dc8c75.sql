-- Create storage policies for funder users - Documentation to Closing stages only
CREATE POLICY "Funder can view files for documentation+ leads" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'hbf-bucket' 
  AND has_role('funder'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);

CREATE POLICY "Funder can upload files for documentation+ leads" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'hbf-bucket' 
  AND has_role('funder'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);

CREATE POLICY "Funder can update files for documentation+ leads" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'hbf-bucket' 
  AND has_role('funder'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);

CREATE POLICY "Funder can delete files for documentation+ leads" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'hbf-bucket' 
  AND has_role('funder'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    INNER JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
    WHERE ce.stage IN ('Documentation', 'Closing')
    AND (storage.foldername(name))[1] = l.id::text
  )
);