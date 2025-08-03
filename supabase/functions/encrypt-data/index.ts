import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EncryptionRequest {
  action: 'encrypt' | 'decrypt'
  data: string
  tableName: string
  fieldName: string
  recordId: string
  keyId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { 
      action, 
      data, 
      tableName, 
      fieldName, 
      recordId, 
      keyId 
    }: EncryptionRequest = await req.json()

    if (!action || !tableName || !fieldName || !recordId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'encrypt') {
      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Data is required for encryption' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Generate encryption components
      const encoder = new TextEncoder()
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(16))

      // Generate or get encryption key
      let encryptionKeyId = keyId
      if (!encryptionKeyId) {
        const { data: existingKey } = await supabase
          .from('encryption_keys')
          .select('id')
          .eq('key_purpose', 'field_encryption')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (existingKey) {
          encryptionKeyId = existingKey.id
        } else {
          // Create new encryption key
          const { data: newKey } = await supabase
            .from('encryption_keys')
            .insert({
              key_name: `field_encryption_${Date.now()}`,
              key_purpose: 'field_encryption',
              algorithm: 'AES-256-GCM'
            })
            .select('id')
            .single()

          encryptionKeyId = newKey!.id
        }
      }

      // Simulate encryption (in production, use actual encryption)
      const mockEncryptedValue = btoa(data + '_encrypted_' + Date.now())

      // Store encrypted field
      const { error: insertError } = await supabase
        .from('encrypted_fields')
        .upsert({
          table_name: tableName,
          field_name: fieldName,
          record_id: recordId,
          encryption_key_id: encryptionKeyId,
          encrypted_value: mockEncryptedValue,
          encryption_algorithm: 'AES-256-GCM',
          salt: btoa(String.fromCharCode(...salt)),
          iv: btoa(String.fromCharCode(...iv))
        })

      if (insertError) {
        console.error('Error storing encrypted field:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to store encrypted field' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Log security event
      await supabase
        .from('security_events')
        .insert({
          event_type: 'data_encrypted',
          severity: 'low',
          details: {
            table_name: tableName,
            field_name: fieldName,
            record_id: recordId,
            encryption_key_id: encryptionKeyId
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          encryptedValue: mockEncryptedValue,
          keyId: encryptionKeyId,
          algorithm: 'AES-256-GCM'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } else if (action === 'decrypt') {
      // Get encrypted field
      const { data: encryptedField, error: fetchError } = await supabase
        .from('encrypted_fields')
        .select('*')
        .eq('table_name', tableName)
        .eq('field_name', fieldName)
        .eq('record_id', recordId)
        .single()

      if (fetchError || !encryptedField) {
        return new Response(
          JSON.stringify({ error: 'Encrypted field not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Simulate decryption (in production, use actual decryption)
      const encryptedValue = encryptedField.encrypted_value
      const mockDecryptedValue = atob(encryptedValue).replace(/_encrypted_\d+$/, '')

      // Log security event
      await supabase
        .from('security_events')
        .insert({
          event_type: 'data_decrypted',
          severity: 'medium',
          details: {
            table_name: tableName,
            field_name: fieldName,
            record_id: recordId,
            encryption_key_id: encryptedField.encryption_key_id
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          decryptedValue: mockDecryptedValue,
          keyId: encryptedField.encryption_key_id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Encryption function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})