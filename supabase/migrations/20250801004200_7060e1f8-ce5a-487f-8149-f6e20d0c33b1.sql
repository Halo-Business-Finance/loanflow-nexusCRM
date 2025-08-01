-- Add underwriter to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'underwriter';

-- Create storage policies for Underwriter access to files for qualified to documentation stages
CREATE POLICY "Underwriter can view files for qualified to documentation stages"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('underwriter'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);

CREATE POLICY "Underwriter can upload files for qualified to documentation stages"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('underwriter'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);

CREATE POLICY "Underwriter can update files for qualified to documentation stages"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('underwriter'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);

CREATE POLICY "Underwriter can delete files for qualified to documentation stages"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('underwriter'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);