-- Check and fix any existing security definer issues
-- First, let's see what might be causing the security warning

-- Drop and recreate the view to ensure it's not marked as security definer
DROP VIEW IF EXISTS public.verified_blockchain_records;

-- Create the view without any security definer properties
CREATE VIEW public.verified_blockchain_records AS
SELECT 
  br.id,
  br.record_type,
  br.record_id,
  br.data_hash,
  br.blockchain_hash,
  br.block_number,
  br.transaction_hash,
  br.verified_at,
  br.verification_status,
  br.created_at,
  br.updated_at,
  br.metadata,
  iat.user_id,
  iat.action,
  iat.is_verified as audit_verified
FROM public.blockchain_records br
LEFT JOIN public.immutable_audit_trail iat ON br.id = iat.blockchain_record_id
WHERE br.verification_status = 'verified';

-- Make sure RLS is enabled on the view (it will inherit from base tables)
ALTER VIEW public.verified_blockchain_records SET (security_barrier = true);