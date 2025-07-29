-- Create function to fix null numeric fields and data consistency issues
CREATE OR REPLACE FUNCTION public.fix_null_numeric_fields()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    fixed_count INTEGER := 0;
    temp_count INTEGER;
    result_message TEXT;
BEGIN
    -- Fix null numeric fields in leads table
    UPDATE public.leads 
    SET loan_amount = 0 
    WHERE loan_amount IS NULL AND stage IN ('Application', 'Pre-approval', 'Documentation', 'Closing');
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    fixed_count := fixed_count + temp_count;
    
    -- Fix null numeric fields in clients table
    UPDATE public.clients 
    SET 
        total_loans = COALESCE(total_loans, 0),
        total_loan_value = COALESCE(total_loan_value, 0)
    WHERE total_loans IS NULL OR total_loan_value IS NULL;
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    fixed_count := fixed_count + temp_count;
    
    -- Fix inconsistent phone number formats in leads
    UPDATE public.leads 
    SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
    WHERE phone IS NOT NULL AND phone ~ '[^0-9\(\)\-\s]';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    fixed_count := fixed_count + temp_count;
    
    -- Fix email formatting (lowercase and trim) in leads
    UPDATE public.leads 
    SET email = lower(trim(email))
    WHERE email IS NOT NULL AND email != lower(trim(email));
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    fixed_count := fixed_count + temp_count;
    
    -- Same fixes for clients table
    UPDATE public.clients 
    SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
    WHERE phone IS NOT NULL AND phone ~ '[^0-9\(\)\-\s]';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    fixed_count := fixed_count + temp_count;
    
    UPDATE public.clients 
    SET email = lower(trim(email))
    WHERE email IS NOT NULL AND email != lower(trim(email));
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    fixed_count := fixed_count + temp_count;
    
    result_message := 'Fixed ' || fixed_count || ' data consistency issues';
    
    -- Log the cleanup action
    INSERT INTO public.audit_logs (
        action, table_name, new_values
    ) VALUES (
        'data_cleanup', 'system', 
        jsonb_build_object('fixed_records', fixed_count, 'timestamp', now())
    );
    
    RETURN result_message;
END;
$$;