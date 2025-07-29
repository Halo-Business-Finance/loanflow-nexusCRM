-- Fix critical data inconsistency: correct pipeline amount that was multiplied by 1000
UPDATE pipeline_entries 
SET amount = 5000000,
    updated_at = now()
WHERE id = 'c39814ae-26bf-40fb-bd9b-b7ed067d6b9e' 
  AND amount = 5000000000;

-- Add a trigger to prevent future data inconsistencies
CREATE OR REPLACE FUNCTION validate_pipeline_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- If lead_id is provided, validate amount matches lead's loan_amount
  IF NEW.lead_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM leads 
      WHERE id = NEW.lead_id 
        AND loan_amount IS NOT NULL 
        AND loan_amount != NEW.amount
    ) THEN
      -- Log the inconsistency for audit
      INSERT INTO audit_logs (action, table_name, record_id, new_values, old_values)
      VALUES (
        'pipeline_amount_validation_failed',
        'pipeline_entries', 
        NEW.id::text,
        jsonb_build_object('new_amount', NEW.amount, 'lead_id', NEW.lead_id),
        jsonb_build_object('expected_from_lead', (SELECT loan_amount FROM leads WHERE id = NEW.lead_id))
      );
      
      -- Auto-correct the amount to match the lead
      NEW.amount := (SELECT loan_amount FROM leads WHERE id = NEW.lead_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for inserts and updates
DROP TRIGGER IF EXISTS validate_pipeline_amount_trigger ON pipeline_entries;
CREATE TRIGGER validate_pipeline_amount_trigger
  BEFORE INSERT OR UPDATE ON pipeline_entries
  FOR EACH ROW
  EXECUTE FUNCTION validate_pipeline_amount();