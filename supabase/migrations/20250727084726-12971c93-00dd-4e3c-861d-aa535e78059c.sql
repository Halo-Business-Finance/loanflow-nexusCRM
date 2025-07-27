-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.is_ip_allowed(client_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    restriction_record RECORD;
BEGIN
    -- Check if IP is in our restrictions table
    SELECT * INTO restriction_record 
    FROM public.ip_restrictions 
    WHERE ip_address = client_ip 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- If found, return the allowed status
    IF FOUND THEN
        RETURN restriction_record.is_allowed;
    END IF;
    
    -- Default to blocked for unknown IPs
    RETURN false;
END;
$$;