-- Add POS information fields to leads and clients tables
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pos_system TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS monthly_processing_volume NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS average_transaction_size NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS processor_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS current_processing_rate NUMERIC;

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pos_system TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS monthly_processing_volume NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS average_transaction_size NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS processor_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS current_processing_rate NUMERIC;