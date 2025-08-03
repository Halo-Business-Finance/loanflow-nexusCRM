import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Adobe Client ID from Supabase secrets
    const adobeClientId = Deno.env.get('ADOBE_CLIENT_ID') || 'dc-pdf-embed-demo'
    
    return new Response(
      JSON.stringify({ 
        clientId: adobeClientId,
        isDemo: adobeClientId === 'dc-pdf-embed-demo'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  } catch (error) {
    console.error('Error getting Adobe config:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get Adobe configuration',
        clientId: 'dc-pdf-embed-demo',
        isDemo: true
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})