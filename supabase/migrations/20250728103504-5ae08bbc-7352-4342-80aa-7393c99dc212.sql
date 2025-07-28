-- Add existing loan amount field to leads table
ALTER TABLE public.leads 
ADD COLUMN existing_loan_amount numeric;