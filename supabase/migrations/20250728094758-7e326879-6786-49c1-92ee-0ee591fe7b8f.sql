-- Add call_notes field to leads table to store call notes
ALTER TABLE public.leads ADD COLUMN call_notes TEXT;