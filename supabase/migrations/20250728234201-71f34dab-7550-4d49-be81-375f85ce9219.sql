-- Add additional fields to clients table to preserve lead information
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS owns_property BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS property_payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS year_established INTEGER,
ADD COLUMN IF NOT EXISTS credit_score INTEGER,
ADD COLUMN IF NOT EXISTS net_operating_income NUMERIC,
ADD COLUMN IF NOT EXISTS bank_lender_name TEXT,
ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC,
ADD COLUMN IF NOT EXISTS existing_loan_amount NUMERIC,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS call_notes TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS income NUMERIC;