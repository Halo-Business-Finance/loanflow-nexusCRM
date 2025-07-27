-- Create IP geolocation tracking table
CREATE TABLE public.ip_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  country_code TEXT,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_restrictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage IP restrictions" 
ON public.ip_restrictions 
FOR ALL 
USING (has_role('admin'::user_role));

CREATE POLICY "System can insert IP restrictions" 
ON public.ip_restrictions 
FOR INSERT 
WITH CHECK (true);

-- Create function to check IP geolocation
CREATE OR REPLACE FUNCTION public.is_ip_allowed(client_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create security configuration for US-only access
INSERT INTO public.security_config (key, value, description) VALUES 
('geo_restriction_enabled', 'true', 'Enable geographic IP restrictions'),
('allowed_countries', '["US"]', 'List of allowed country codes'),
('block_tor_exit_nodes', 'true', 'Block known Tor exit nodes'),
('block_vpn_proxies', 'true', 'Block known VPN and proxy services'),
('require_us_location', 'true', 'Require users to be located in the United States');

-- Create trigger for IP restrictions updates
CREATE TRIGGER update_ip_restrictions_updated_at
BEFORE UPDATE ON public.ip_restrictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();