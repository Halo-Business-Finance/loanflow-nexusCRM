-- Add property_payment_amount column to leads table
ALTER TABLE public.leads 
ADD COLUMN property_payment_amount NUMERIC;