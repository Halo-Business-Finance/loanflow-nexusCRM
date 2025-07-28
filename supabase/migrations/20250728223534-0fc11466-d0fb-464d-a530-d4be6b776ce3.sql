-- Add year_established column to leads table
ALTER TABLE public.leads 
ADD COLUMN year_established INTEGER;