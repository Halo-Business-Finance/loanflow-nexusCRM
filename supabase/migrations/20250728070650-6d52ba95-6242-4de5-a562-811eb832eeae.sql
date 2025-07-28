-- Add loan_type column to leads table
ALTER TABLE public.leads 
ADD COLUMN loan_type text DEFAULT 'Mortgage';