-- Fix the handle_lead_to_client_conversion trigger function
-- The issue is it's trying to access stage from leads table but stage is in contact_entities table

CREATE OR REPLACE FUNCTION public.handle_lead_to_client_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    contact_entity_record RECORD;
    old_contact_stage TEXT;
    new_contact_stage TEXT;
BEGIN
    -- Get the current and previous stage from contact_entities table (not leads table)
    SELECT stage INTO new_contact_stage 
    FROM public.contact_entities 
    WHERE id = NEW.contact_entity_id;
    
    -- For old stage, we need to check if this is a manual conversion trigger
    -- If is_converted_to_client is being changed to true, check if stage is 'Loan Funded'
    IF NEW.is_converted_to_client = true AND (OLD.is_converted_to_client = false OR OLD.is_converted_to_client IS NULL) THEN
        
        -- Get the contact entity information
        SELECT * INTO contact_entity_record 
        FROM public.contact_entities 
        WHERE id = NEW.contact_entity_id;
        
        -- Only proceed if the contact entity stage is 'Loan Funded'
        IF contact_entity_record.stage = 'Loan Funded' THEN
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
                COALESCE(contact_entity_record.loan_amount, 0),
                now(),
                now()
            );
            
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
                jsonb_build_object('is_converted_to_client', OLD.is_converted_to_client),
                jsonb_build_object('is_converted_to_client', NEW.is_converted_to_client)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;