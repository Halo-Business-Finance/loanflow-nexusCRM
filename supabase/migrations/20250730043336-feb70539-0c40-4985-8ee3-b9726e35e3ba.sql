-- Fix the function search path security issue
ALTER FUNCTION public.update_contact_entities_updated_at() SET search_path = '';