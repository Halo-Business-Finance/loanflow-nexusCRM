-- Add NAICS Code field to leads table
ALTER TABLE public.leads ADD COLUMN naics_code text;

-- Add NAICS Code field to clients table  
ALTER TABLE public.clients ADD COLUMN naics_code text;

-- Add comments for clarity
COMMENT ON COLUMN public.leads.naics_code IS 'North American Industry Classification System (NAICS) code for the business';
COMMENT ON COLUMN public.clients.naics_code IS 'North American Industry Classification System (NAICS) code for the business';