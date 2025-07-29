-- Fix security warning: set proper search_path for function
CREATE OR REPLACE FUNCTION validate_pipeline_amount()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- If lead_id is provided, validate amount matches lead's loan_amount
  IF NEW.lead_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.leads 
      WHERE id = NEW.lead_id 
        AND loan_amount IS NOT NULL 
        AND loan_amount != NEW.amount
    ) THEN
      -- Log the inconsistency for audit
      INSERT INTO public.audit_logs (action, table_name, record_id, new_values, old_values)
      VALUES (
        'pipeline_amount_validation_failed',
        'pipeline_entries', 
        NEW.id::text,
        jsonb_build_object('new_amount', NEW.amount, 'lead_id', NEW.lead_id),
        jsonb_build_object('expected_from_lead', (SELECT loan_amount FROM public.leads WHERE id = NEW.lead_id))
      );
      
      -- Auto-correct the amount to match the lead
      NEW.amount := (SELECT loan_amount FROM public.leads WHERE id = NEW.lead_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;