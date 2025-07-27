import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP address - handle forwarded IPs properly
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    
    // Parse the first IP from forwarded chain
    let clientIP = 'unknown';
    if (forwardedFor) {
      clientIP = forwardedFor.split(',')[0].trim();
    } else if (realIP) {
      clientIP = realIP.trim();
    }
    
    console.log('Checking geo-restriction for IP:', clientIP);

    // Known Tor exit nodes and VPN/Proxy indicators
    const suspiciousHeaders = [
      'tor-exit-node',
      'x-tor',
      'x-forwarded-proto',
      'x-forwarded-host'
    ];

    const userAgent = req.headers.get('user-agent') || '';
    const isSuspicious = suspiciousHeaders.some(header => req.headers.has(header)) ||
                        userAgent.toLowerCase().includes('tor') ||
                        userAgent.toLowerCase().includes('proxy');

    // Check IP geolocation using a free service
    let countryCode = 'UNKNOWN';
    let isAllowed = true; // Temporarily allow all traffic while debugging
    
    console.log('DEBUG: Starting geo check for IP:', clientIP);
    console.log('DEBUG: User agent:', userAgent);
    console.log('DEBUG: Is suspicious?', isSuspicious);
    
    try {
      // Skip geolocation for localhost/private IPs and allow them (development)
      if (clientIP === 'unknown' || clientIP.startsWith('127.') || 
          clientIP.startsWith('192.168.') || clientIP.startsWith('10.') ||
          clientIP.startsWith('172.')) {
        console.log('DEBUG: Local/private IP detected, allowing access for development');
        countryCode = 'US';
        isAllowed = true;
      } else {
        // Use ipapi.co for geolocation (free tier: 1000 requests/day)
        console.log('DEBUG: Attempting geolocation for IP:', clientIP);
        const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
        const geoData = await geoResponse.json();
        countryCode = geoData.country_code || 'UNKNOWN';
        
        console.log('DEBUG: Geolocation result:', { ip: clientIP, country: countryCode, fullData: geoData });

        // TEMPORARILY ALLOW ALL - Check if country is allowed (US only)
        // isAllowed = countryCode === 'US' && !isSuspicious;
        isAllowed = true; // Temporary override
        
        console.log('DEBUG: Access decision - Country:', countryCode, 'Suspicious:', isSuspicious, 'Allowed:', isAllowed);
      }
      
    } catch (geoError) {
      console.error('DEBUG: Geolocation check failed:', geoError);
      // Temporarily allow access on any error
      isAllowed = true;
      countryCode = 'US';
      console.log('DEBUG: Error occurred, temporarily allowing access');
    }

    // Log the IP restriction
    try {
      await supabase
        .from('ip_restrictions')
        .upsert({
          ip_address: clientIP,
          country_code: countryCode,
          is_allowed: isAllowed,
          reason: !isAllowed ? 
            (countryCode !== 'US' ? 'Non-US location' : 'Suspicious traffic detected') : 
            'Allowed US location'
        });
    } catch (logError) {
      console.error('Failed to log IP restriction:', logError);
    }

    // Log security event if blocked
    if (!isAllowed) {
      try {
        await supabase.rpc('log_security_event', {
          p_event_type: 'geo_restriction_blocked',
          p_severity: 'high',
          p_details: {
            ip_address: clientIP,
            country_code: countryCode,
            user_agent: userAgent,
            suspicious_headers: suspiciousHeaders.filter(h => req.headers.has(h)),
            reason: countryCode !== 'US' ? 'Non-US location' : 'Suspicious traffic'
          },
          p_ip_address: clientIP,
          p_user_agent: userAgent
        });
      } catch (eventError) {
        console.error('Failed to log security event:', eventError);
      }
    }

    return new Response(
      JSON.stringify({
        allowed: isAllowed,
        country: countryCode,
        ip: clientIP,
        reason: !isAllowed ? 'Access restricted to US locations only' : 'Access allowed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isAllowed ? 200 : 403
      }
    );

  } catch (error) {
    console.error('Geo-security check error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Security check failed',
        allowed: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});