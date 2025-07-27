import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, phoneNumber } = await req.json()

    // Get user's RingCentral account
    const { data: rcAccount, error: rcError } = await supabaseClient
      .from('ringcentral_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (rcError || !rcAccount) {
      throw new Error('RingCentral account not configured')
    }

    // Authenticate with RingCentral
    const authResponse = await fetch(`${rcAccount.server_url}/restapi/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${rcAccount.client_id}:${rcAccount.client_secret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: rcAccount.username,
        password: rcAccount.client_secret, // This should be the actual password
        extension: rcAccount.extension || ''
      })
    })

    if (!authResponse.ok) {
      const error = await authResponse.text()
      console.error('RingCentral auth error:', error)
      throw new Error('Failed to authenticate with RingCentral')
    }

    const authData = await authResponse.json()
    console.log('RingCentral authenticated successfully')

    let result = {}

    if (action === 'call' && phoneNumber) {
      // Make a RingOut call
      const callResponse = await fetch(`${rcAccount.server_url}/restapi/v1.0/account/~/extension/~/ring-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: { phoneNumber: rcAccount.username },
          to: { phoneNumber: phoneNumber },
          playPrompt: false
        })
      })

      if (!callResponse.ok) {
        const error = await callResponse.text()
        console.error('RingCentral call error:', error)
        throw new Error('Failed to initiate call')
      }

      result = await callResponse.json()
      console.log('Call initiated:', result)

    } else if (action === 'status') {
      // Get extension info
      const extensionResponse = await fetch(`${rcAccount.server_url}/restapi/v1.0/account/~/extension/~`, {
        headers: {
          'Authorization': `Bearer ${authData.access_token}`
        }
      })

      if (!extensionResponse.ok) {
        throw new Error('Failed to get extension status')
      }

      result = await extensionResponse.json()
      console.log('Extension status:', result)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ringcentral-auth function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})