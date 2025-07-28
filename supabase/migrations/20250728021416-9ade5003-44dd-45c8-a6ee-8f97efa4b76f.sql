-- Add business_name column to leads table
ALTER TABLE public.leads 
ADD COLUMN business_name text;