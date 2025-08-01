-- Add LoanProcessor to user_role enum
ALTER TYPE public.user_role ADD VALUE 'loan_processor';

-- Create storage policies for LoanProcessor access to files for specific lead stages
CREATE POLICY "LoanProcessor can view files for qualified to documentation stages"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('loan_processor'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);

CREATE POLICY "LoanProcessor can upload files for qualified to documentation stages"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('loan_processor'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);

CREATE POLICY "LoanProcessor can update files for qualified to documentation stages"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('loan_processor'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);

CREATE POLICY "LoanProcessor can delete files for qualified to documentation stages"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hbf-bucket' AND
  (
    has_role('loan_processor'::user_role) AND
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.contact_entities ce ON l.contact_entity_id = ce.id
      WHERE ce.stage IN ('Qualified', 'Application', 'Pre-approval', 'Documentation')
      AND (string_to_array(name, '/'))[1] = l.id::text
    )
  )
);