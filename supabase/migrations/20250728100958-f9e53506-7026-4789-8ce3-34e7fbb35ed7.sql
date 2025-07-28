-- Add business information fields to leads table
ALTER TABLE public.leads 
ADD COLUMN business_address text,
ADD COLUMN owns_property boolean DEFAULT false;