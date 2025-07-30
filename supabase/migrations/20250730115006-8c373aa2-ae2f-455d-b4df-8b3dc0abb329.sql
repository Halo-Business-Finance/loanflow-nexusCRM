-- Add unique constraint on fingerprint_hash to support upsert operations
-- This will fix the "ON CONFLICT" errors in AdvancedThreatDetection component

ALTER TABLE public.device_fingerprints 
ADD CONSTRAINT device_fingerprints_fingerprint_hash_unique 
UNIQUE (fingerprint_hash);

-- Create index for better performance on fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint_hash 
ON public.device_fingerprints (fingerprint_hash);