import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, ip_address, user_agent, device_fingerprint, location } = await req.json();
    
    console.log(`Enhanced auth request: ${action} for ${email}`);

    switch (action) {
      case 'validate_password':
        return await validatePassword(password);
      
      case 'check_rate_limit':
        return await checkRateLimit(ip_address || email, 'login');
        
      case 'log_security_event':
        return await logSecurityEvent(req);
        
      case 'validate_session':
        return await validateSession(req);
        
      default:
        throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in enhanced-auth function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

async function validatePassword(password: string) {
  try {
    const { data, error } = await supabase.rpc('validate_password_strength', {
      password: password
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      validation_result: data
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    throw new Error(`Password validation failed: ${error.message}`);
  }
}

async function checkRateLimit(identifier: string, actionType: string) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action_type: actionType,
      p_max_attempts: 5,
      p_window_minutes: 15
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      rate_limit_result: data
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }
}

async function logSecurityEvent(req: Request) {
  try {
    const { user_id, event_type, severity, details, ip_address, user_agent, device_fingerprint, location } = await req.json();
    
    const { data, error } = await supabase.rpc('log_enhanced_security_event', {
      p_user_id: user_id,
      p_event_type: event_type,
      p_severity: severity || 'medium',
      p_details: details || {},
      p_ip_address: ip_address,
      p_user_agent: user_agent,
      p_device_fingerprint: device_fingerprint,
      p_location: location || {}
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      event_id: data
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    throw new Error(`Security event logging failed: ${error.message}`);
  }
}

async function validateSession(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid session');
    }

    // Get client information
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check for suspicious activity
    const riskScore = await calculateRiskScore(user.id, clientIP, userAgent);
    
    // Update session activity
    await supabase
      .from('secure_sessions')
      .upsert({
        user_id: user.id,
        session_token: token.substring(0, 32), // Store partial token for tracking
        ip_address: clientIP,
        user_agent: userAgent,
        risk_score: riskScore,
        last_activity: new Date().toISOString(),
        is_suspicious: riskScore > 70
      });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      security: {
        risk_score: riskScore,
        is_suspicious: riskScore > 70,
        requires_mfa: riskScore > 50
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    throw new Error(`Session validation failed: ${error.message}`);
  }
}

async function calculateRiskScore(userId: string, ipAddress: string, userAgent: string): Promise<number> {
  let riskScore = 0;
  
  try {
    // Check IP reputation
    const { data: ipRestriction } = await supabase
      .from('ip_restrictions')
      .select('is_allowed')
      .eq('ip_address', ipAddress)
      .single();

    if (ipRestriction && !ipRestriction.is_allowed) {
      riskScore += 50;
    }

    // Check for unusual login patterns
    const { data: recentSessions } = await supabase
      .from('secure_sessions')
      .select('ip_address, user_agent')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentSessions && recentSessions.length > 0) {
      // Check for new IP
      const knownIPs = recentSessions.map(s => s.ip_address);
      if (!knownIPs.includes(ipAddress)) {
        riskScore += 30;
      }

      // Check for new user agent
      const knownUserAgents = recentSessions.map(s => s.user_agent);
      if (!knownUserAgents.includes(userAgent)) {
        riskScore += 20;
      }
    }

    // Check failed login attempts
    const { data: failedAttempts } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('attempt_time', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('attempt_time', { ascending: false });

    if (failedAttempts && failedAttempts.length > 3) {
      riskScore += 40;
    }

  } catch (error) {
    console.error('Error calculating risk score:', error);
    // Default to medium risk if calculation fails
    riskScore = 25;
  }

  return Math.min(riskScore, 100);
}