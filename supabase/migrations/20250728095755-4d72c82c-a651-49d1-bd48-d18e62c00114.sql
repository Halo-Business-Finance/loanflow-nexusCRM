-- Add annual_revenue column to leads table
ALTER TABLE public.leads 
ADD COLUMN annual_revenue numeric;