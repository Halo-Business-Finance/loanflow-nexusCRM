-- Fix the security warning for the update_loan_requests_updated_at function
-- by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_loan_requests_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;