import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const webhookSecret = Deno.env.get('WEBHOOK_SECRET') ?? 'default-secret-key';
    const signature = req.headers.get('x-webhook-signature');
    const body = await req.text();

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.log('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the webhook event for security auditing
    await supabase.from('webhook_events').insert({
      event_type: payload.type || 'unknown',
      payload: payload,
      source_ip: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      signature_verified: true,
      processed_at: new Date().toISOString()
    });

    // Process the webhook based on event type
    switch (payload.type) {
      case 'security_alert':
        await handleSecurityAlert(supabase, payload);
        break;
      case 'automation_trigger':
        await handleAutomationTrigger(supabase, payload);
        break;
      case 'system_notification':
        await handleSystemNotification(supabase, payload);
        break;
      default:
        console.log(`Unknown webhook event type: ${payload.type}`);
    }

    return new Response(JSON.stringify({ 
      status: 'success', 
      message: 'Webhook processed successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Create HMAC signature
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(payload);
    
    // Use Web Crypto API to create HMAC
    return crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(cryptoKey => {
      return crypto.subtle.sign('HMAC', cryptoKey, data);
    }).then(signatureBuffer => {
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return signature === `sha256=${expectedSignature}`;
    }).catch(() => false);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function handleSecurityAlert(supabase: any, payload: any) {
  console.log('Processing security alert:', payload);
  
  // Create security notification
  await supabase.from('security_notifications').insert({
    notification_type: 'webhook_security_alert',
    title: payload.title || 'Security Alert from Webhook',
    message: payload.message || 'Security event detected via webhook',
    severity: payload.severity || 'medium',
    metadata: payload
  });
}

async function handleAutomationTrigger(supabase: any, payload: any) {
  console.log('Processing automation trigger:', payload);
  
  // Log automation event
  await supabase.from('audit_logs').insert({
    action: 'webhook_automation_trigger',
    table_name: 'webhooks',
    new_values: payload
  });
}

async function handleSystemNotification(supabase: any, payload: any) {
  console.log('Processing system notification:', payload);
  
  // Create system notification
  await supabase.from('security_notifications').insert({
    notification_type: 'system_notification',
    title: payload.title || 'System Notification',
    message: payload.message || 'System event via webhook',
    severity: payload.severity || 'low',
    metadata: payload
  });
}