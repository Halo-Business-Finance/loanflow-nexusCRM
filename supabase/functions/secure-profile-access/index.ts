import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, profile_id, updates, profile_ids } = await req.json()
    
    // Get the authenticated user from the request header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      throw new Error('Invalid authentication')
    }

    console.log(`Secure profile access request: ${action} by user ${user.id}`)

    switch (action) {
      case 'get_masked_profile':
        return await getMaskedProfile(profile_id, user.id)
      case 'get_multiple_profiles':
        return await getMultipleProfiles(req, user.id)
      case 'update_profile_secure':
        return await updateProfileSecure(profile_id, updates, user.id)
      case 'migrate_existing_data':
        return await migrateExistingData(user.id)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    console.error('Secure profile access error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function getMaskedProfile(profileId: string, requestingUserId: string) {
  try {
    const { data, error } = await supabase.rpc('get_masked_profile_data', {
      p_profile_id: profileId,
      p_requesting_user_id: requestingUserId
    })

    if (error) {
      throw error
    }

    console.log(`Profile data accessed for ${profileId} by ${requestingUserId}`)

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error getting masked profile:', error)
    throw error
  }
}

async function getMultipleProfiles(req: Request, requestingUserId: string) {
  try {
    const body = await req.text()
    const { profile_ids } = JSON.parse(body)
    
    if (!Array.isArray(profile_ids)) {
      throw new Error('profile_ids must be an array')
    }

    // Get masked data for each profile
    const profilePromises = profile_ids.map(async (profileId: string) => {
      const { data, error } = await supabase.rpc('get_masked_profile_data', {
        p_profile_id: profileId,
        p_requesting_user_id: requestingUserId
      })
      
      if (error) {
        console.error(`Error getting profile ${profileId}:`, error)
        return null
      }
      
      return data
    })

    const profiles = await Promise.all(profilePromises)
    const validProfiles = profiles.filter(p => p !== null)

    console.log(`Multiple profiles accessed: ${profile_ids.length} requested, ${validProfiles.length} returned`)

    return new Response(
      JSON.stringify({ data: validProfiles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error getting multiple profiles:', error)
    throw error
  }
}

async function updateProfileSecure(profileId: string, updates: any, requestingUserId: string) {
  try {
    // Validate that user can update this profile
    if (profileId !== requestingUserId) {
      // Check if user has admin permissions
      const { data: role } = await supabase.rpc('get_user_role', {
        p_user_id: requestingUserId
      })
      
      if (!role || !['admin', 'super_admin'].includes(role)) {
        throw new Error('Unauthorized to update this profile')
      }
    }

    const { data, error } = await supabase.rpc('update_profile_secure', {
      p_profile_id: profileId,
      p_updates: updates
    })

    if (error) {
      throw error
    }

    console.log(`Profile ${profileId} updated securely by ${requestingUserId}`)

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

async function migrateExistingData(requestingUserId: string) {
  try {
    // Check if user has admin permissions for migration
    const { data: role } = await supabase.rpc('get_user_role', {
      p_user_id: requestingUserId
    })
    
    if (!role || !['admin', 'super_admin'].includes(role)) {
      throw new Error('Unauthorized to perform data migration')
    }

    // Get all profiles with sensitive data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, phone_number')
      .not('email', 'is', null)
      .not('phone_number', 'is', null)

    if (profilesError) {
      throw profilesError
    }

    let migratedCount = 0
    
    // Encrypt existing sensitive data
    for (const profile of profiles || []) {
      if (profile.email) {
        await supabase.rpc('encrypt_profile_field', {
          p_profile_id: profile.id,
          p_field_name: 'email',
          p_field_value: profile.email
        })
      }
      
      if (profile.phone_number) {
        await supabase.rpc('encrypt_profile_field', {
          p_profile_id: profile.id,
          p_field_name: 'phone_number',
          p_field_value: profile.phone_number
        })
      }
      
      // Clear sensitive data from main table
      await supabase
        .from('profiles')
        .update({ email: null, phone_number: null })
        .eq('id', profile.id)
      
      migratedCount++
    }

    console.log(`Data migration completed: ${migratedCount} profiles migrated`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        migrated_profiles: migratedCount,
        message: 'Existing sensitive data has been encrypted and migrated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error during data migration:', error)
    throw error
  }
}