-- Add missing fields from leads table to clients table
ALTER TABLE public.clients 
ADD COLUMN stage text,
ADD COLUMN maturity_date date,
ADD COLUMN interest_rate numeric,
ADD COLUMN loan_amount numeric,
ADD COLUMN loan_type text;