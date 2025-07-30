-- Add business ownership structure field to leads table
ALTER TABLE public.leads ADD COLUMN ownership_structure text;

-- Add business ownership structure field to clients table  
ALTER TABLE public.clients ADD COLUMN ownership_structure text;

-- Add comments for clarity
COMMENT ON COLUMN public.leads.ownership_structure IS 'Business ownership structure (e.g., LLC, Corporation, Partnership, etc.)';
COMMENT ON COLUMN public.clients.ownership_structure IS 'Business ownership structure (e.g., LLC, Corporation, Partnership, etc.)';