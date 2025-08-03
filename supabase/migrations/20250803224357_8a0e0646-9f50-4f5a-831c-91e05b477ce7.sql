-- Update CSP to allow iframe content from Supabase storage for document viewing
UPDATE security_headers 
SET header_value = 'default-src ''self''; script-src ''self'' ''unsafe-inline''; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https:; font-src ''self''; connect-src ''self'' https://gshxxsniwytjgcnthyfq.supabase.co; frame-src ''self'' https://gshxxsniwytjgcnthyfq.supabase.co blob: data:; object-src ''none''; base-uri ''self'';'
WHERE header_name = 'Content-Security-Policy' AND is_active = true;