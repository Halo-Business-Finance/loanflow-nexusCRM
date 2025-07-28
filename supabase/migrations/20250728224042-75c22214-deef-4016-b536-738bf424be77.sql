-- Add net_operating_income and bank_lender_name columns to leads table
ALTER TABLE public.leads 
ADD COLUMN net_operating_income NUMERIC,
ADD COLUMN bank_lender_name TEXT;