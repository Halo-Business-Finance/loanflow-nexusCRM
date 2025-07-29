-- Add BDO fields to leads table
ALTER TABLE public.leads 
ADD COLUMN bdo_name TEXT,
ADD COLUMN bdo_telephone TEXT,
ADD COLUMN bdo_email TEXT;

-- Add BDO fields to clients table
ALTER TABLE public.clients 
ADD COLUMN bdo_name TEXT,
ADD COLUMN bdo_telephone TEXT,
ADD COLUMN bdo_email TEXT;