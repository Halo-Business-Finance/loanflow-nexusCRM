-- Drop the problematic view and recreate without SECURITY DEFINER
DROP VIEW public.verified_blockchain_records;

-- Create a regular view without SECURITY DEFINER
CREATE VIEW public.verified_blockchain_records AS
SELECT 
  br.*,
  iat.user_id,
  iat.action,
  iat.is_verified as audit_verified
FROM public.blockchain_records br
LEFT JOIN public.immutable_audit_trail iat ON br.id = iat.blockchain_record_id
WHERE br.verification_status = 'verified';