-- Fix Security Definer View issue by dropping and recreating the view properly
-- The linter detected a security issue with the verified_blockchain_records view

-- Drop the existing view
DROP VIEW IF EXISTS public.verified_blockchain_records;

-- Recreate the view without SECURITY DEFINER to ensure proper RLS enforcement
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
    iat.is_verified AS audit_verified
FROM blockchain_records br
LEFT JOIN immutable_audit_trail iat ON (br.id = iat.blockchain_record_id)
WHERE br.verification_status = 'verified';

-- Add proper RLS policy for the view
ALTER VIEW public.verified_blockchain_records SET (security_invoker = true);

-- Ensure proper permissions - only admins can access verified blockchain records
CREATE POLICY "Only admins can view verified blockchain records" 
ON public.blockchain_records 
FOR SELECT 
USING (has_role('admin'::user_role));