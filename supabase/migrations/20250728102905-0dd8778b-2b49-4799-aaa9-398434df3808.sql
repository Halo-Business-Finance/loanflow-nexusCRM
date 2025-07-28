-- Add interest rate and maturity date fields to leads table for property loans
ALTER TABLE public.leads 
ADD COLUMN interest_rate numeric,
ADD COLUMN maturity_date date;