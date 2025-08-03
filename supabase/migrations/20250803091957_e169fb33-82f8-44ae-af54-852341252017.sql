-- Create function to automatically convert lead to client when funded
CREATE OR REPLACE FUNCTION public.handle_lead_to_client_conversion()
RETURNS TRIGGER AS $$
DECLARE
    contact_entity_record RECORD;
BEGIN
    -- Check if stage changed to 'Loan Funded' and lead is not already converted
    IF NEW.stage = 'Loan Funded' AND OLD.stage != 'Loan Funded' AND NEW.is_converted_to_client = false THEN
        
        -- Get the contact entity information
        SELECT * INTO contact_entity_record 
        FROM public.contact_entities 
        WHERE id = NEW.contact_entity_id;
        
        -- Create new client record with lead information
        INSERT INTO public.clients (
            user_id,
            contact_entity_id,
            lead_id,
            status,
            total_loans,
            total_loan_value,
            join_date,
            last_activity
        ) VALUES (
            NEW.user_id,
            NEW.contact_entity_id,
            NEW.id,
            'Active',
            1, -- First loan
            COALESCE(NEW.loan_amount, contact_entity_record.loan_amount, 0),
            now(),
            now()
        );
        
        -- Mark the lead as converted to client
        NEW.is_converted_to_client = true;
        
        -- Log the conversion for audit purposes
        INSERT INTO public.audit_logs (
            user_id, 
            action, 
            table_name, 
            record_id, 
            old_values,
            new_values
        ) VALUES (
            NEW.user_id,
            'lead_converted_to_client',
            'leads',
            NEW.id::text,
            jsonb_build_object('stage', OLD.stage, 'is_converted_to_client', OLD.is_converted_to_client),
            jsonb_build_object('stage', NEW.stage, 'is_converted_to_client', NEW.is_converted_to_client)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to fire on lead updates
CREATE TRIGGER trigger_lead_to_client_conversion
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_lead_to_client_conversion();