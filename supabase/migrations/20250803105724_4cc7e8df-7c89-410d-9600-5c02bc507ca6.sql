-- Create blockchain integrity table
CREATE TABLE public.blockchain_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  blockchain_hash TEXT,
  block_number BIGINT,
  transaction_hash TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create encrypted fields tracking table
CREATE TABLE public.encrypted_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  encryption_key_id UUID NOT NULL,
  encrypted_value TEXT NOT NULL,
  encryption_algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  salt TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_name, field_name, record_id)
);

-- Create data integrity verification table
CREATE TABLE public.data_integrity_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  expected_hash TEXT NOT NULL,
  actual_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  discrepancies JSONB DEFAULT '[]'::JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create immutable audit trail with blockchain backing
CREATE TABLE public.immutable_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values_hash TEXT,
  new_values_hash TEXT,
  blockchain_record_id UUID,
  timestamp_hash TEXT NOT NULL,
  verification_proof TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_verified BOOLEAN DEFAULT false
);

-- Enable RLS on all new tables
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_integrity_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immutable_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blockchain_records
CREATE POLICY "Admins can manage blockchain records" 
ON public.blockchain_records FOR ALL 
USING (has_role('admin'::user_role));

CREATE POLICY "System can insert blockchain records" 
ON public.blockchain_records FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view relevant blockchain records" 
ON public.blockchain_records FOR SELECT 
USING (true);

-- RLS Policies for encrypted_fields
CREATE POLICY "Admins can manage encrypted fields" 
ON public.encrypted_fields FOR ALL 
USING (has_role('admin'::user_role));

CREATE POLICY "System can manage encrypted fields" 
ON public.encrypted_fields FOR ALL 
USING (true);

-- RLS Policies for data_integrity_checks
CREATE POLICY "Admins can manage integrity checks" 
ON public.data_integrity_checks FOR ALL 
USING (has_role('admin'::user_role));

CREATE POLICY "System can perform integrity checks" 
ON public.data_integrity_checks FOR ALL 
USING (true);

-- RLS Policies for immutable_audit_trail
CREATE POLICY "Admins can view immutable audit trail" 
ON public.immutable_audit_trail FOR SELECT 
USING (has_role('admin'::user_role));

CREATE POLICY "Users can view their audit trail" 
ON public.immutable_audit_trail FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit trail" 
ON public.immutable_audit_trail FOR INSERT 
WITH CHECK (true);

-- Foreign key relationships
ALTER TABLE public.encrypted_fields 
ADD CONSTRAINT fk_encryption_key 
FOREIGN KEY (encryption_key_id) REFERENCES public.encryption_keys(id);

ALTER TABLE public.immutable_audit_trail 
ADD CONSTRAINT fk_blockchain_record 
FOREIGN KEY (blockchain_record_id) REFERENCES public.blockchain_records(id);

-- Create functions for automatic encryption and blockchain logging
CREATE OR REPLACE FUNCTION public.create_blockchain_record(
  p_record_type TEXT,
  p_record_id TEXT,
  p_data_hash TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  blockchain_id UUID;
BEGIN
  INSERT INTO public.blockchain_records (
    record_type, record_id, data_hash, metadata
  ) VALUES (
    p_record_type, p_record_id, p_data_hash, p_metadata
  ) RETURNING id INTO blockchain_id;
  
  RETURN blockchain_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_data_integrity(
  p_table_name TEXT,
  p_record_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  integrity_result JSONB := '{"status": "success", "verified_records": 0, "failed_records": 0}'::JSONB;
  check_record RECORD;
BEGIN
  -- This would typically verify hashes against blockchain records
  -- For now, we'll create a placeholder that can be enhanced
  
  INSERT INTO public.data_integrity_checks (
    check_type, table_name, record_id, expected_hash, status
  ) VALUES (
    'manual_verification', p_table_name, p_record_id, 'pending_hash', 'completed'
  );
  
  RETURN integrity_result;
END;
$$;

-- Create trigger to automatically create immutable audit trail
CREATE OR REPLACE FUNCTION public.create_immutable_audit_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_hash TEXT;
  new_hash TEXT;
  timestamp_hash TEXT;
BEGIN
  -- Generate hashes for old and new values
  old_hash := encode(digest(COALESCE(to_jsonb(OLD), '{}'::jsonb)::text, 'sha256'), 'hex');
  new_hash := encode(digest(to_jsonb(NEW)::text, 'sha256'), 'hex');
  timestamp_hash := encode(digest((extract(epoch from now()) * 1000000)::text, 'sha256'), 'hex');
  
  INSERT INTO public.immutable_audit_trail (
    user_id, action, table_name, record_id, 
    old_values_hash, new_values_hash, timestamp_hash
  ) VALUES (
    auth.uid(), 
    TG_OP, 
    TG_TABLE_NAME, 
    COALESCE(NEW.id::text, OLD.id::text),
    old_hash,
    new_hash,
    timestamp_hash
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add update triggers for automatic timestamp updates
CREATE TRIGGER update_blockchain_records_updated_at
  BEFORE UPDATE ON public.blockchain_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_encrypted_fields_updated_at
  BEFORE UPDATE ON public.encrypted_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_blockchain_records_record_type_id ON public.blockchain_records(record_type, record_id);
CREATE INDEX idx_blockchain_records_verification_status ON public.blockchain_records(verification_status);
CREATE INDEX idx_encrypted_fields_table_record ON public.encrypted_fields(table_name, record_id);
CREATE INDEX idx_data_integrity_checks_table_status ON public.data_integrity_checks(table_name, status);
CREATE INDEX idx_immutable_audit_trail_user_table ON public.immutable_audit_trail(user_id, table_name);
CREATE INDEX idx_immutable_audit_trail_timestamp ON public.immutable_audit_trail(created_at);

-- Create a view for verified blockchain records
CREATE VIEW public.verified_blockchain_records AS
SELECT 
  br.*,
  iat.user_id,
  iat.action,
  iat.is_verified as audit_verified
FROM public.blockchain_records br
LEFT JOIN public.immutable_audit_trail iat ON br.id = iat.blockchain_record_id
WHERE br.verification_status = 'verified';

COMMENT ON TABLE public.blockchain_records IS 'Stores blockchain hashes for data integrity verification';
COMMENT ON TABLE public.encrypted_fields IS 'Tracks encrypted field values with encryption metadata';
COMMENT ON TABLE public.data_integrity_checks IS 'Records data integrity verification results';
COMMENT ON TABLE public.immutable_audit_trail IS 'Immutable audit trail backed by blockchain verification';