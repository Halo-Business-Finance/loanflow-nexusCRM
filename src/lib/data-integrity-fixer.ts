import { supabase } from "@/integrations/supabase/client"

export class DataIntegrityFixer {
  async checkAuthAndPermissions(): Promise<{ authenticated: boolean; userId: string | null; contactCount: number }> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { authenticated: false, userId: null, contactCount: 0 }
      }
      
      // Check how many contacts the user can access
      const { data: contacts, error } = await supabase
        .from('contact_entities')
        .select('id')
        
      return { 
        authenticated: true, 
        userId: user.id, 
        contactCount: contacts?.length || 0 
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      return { authenticated: false, userId: null, contactCount: 0 }
    }
  }

  async fixCurrentUserContactIssues(): Promise<{ fixed: number; errors: string[] }> {
    const result = { fixed: 0, errors: [] }

    try {
      console.log('🔧 Starting auto-fix for current user data...')
      
      // First check if user is authenticated
      const authCheck = await this.checkAuthAndPermissions()
      console.log('🔐 Auth check:', authCheck)
      
      if (!authCheck.authenticated) {
        result.errors.push('❌ User not authenticated. Please log in to fix data issues.')
        return result
      }
      
      if (authCheck.contactCount === 0) {
        result.errors.push('ℹ️ No contact entities found for current user.')
        return result
      }
      
      console.log(`👤 Authenticated as user ${authCheck.userId} with ${authCheck.contactCount} contacts`)
      
      // Fix null loan amounts for current user's contact entities
      const { data: userContacts, error: fetchError } = await supabase
        .from('contact_entities')
        .select('id, loan_amount, business_name, name')
        .is('loan_amount', null)
      
      if (fetchError) {
        console.error('❌ Error fetching user contacts:', fetchError)
        result.errors.push(`Failed to fetch contacts: ${fetchError.message}`)
        return result
      }
      
      console.log(`📋 Found ${userContacts?.length || 0} contacts with null loan amounts for current user`)
      
      if (userContacts && userContacts.length > 0) {
        for (const contact of userContacts) {
          try {
            // Set reasonable default based on business type
            const defaultLoanAmount = contact.business_name ? 100000 : 50000
            
            console.log(`🔨 Fixing ${contact.name} (${contact.id}): Setting loan amount to $${defaultLoanAmount}`)
            
            const { error: updateError } = await supabase
              .from('contact_entities')
              .update({ 
                loan_amount: defaultLoanAmount 
              })
              .eq('id', contact.id)
            
            if (!updateError) {
              result.fixed++
              console.log(`✅ Successfully fixed ${contact.name}`)
            } else {
              console.error(`❌ Failed to fix ${contact.name}:`, updateError)
              result.errors.push(`Failed to fix ${contact.name}: ${updateError.message}`)
            }
          } catch (contactError) {
            console.error(`❌ Exception fixing ${contact.name}:`, contactError)
            result.errors.push(`Exception fixing ${contact.name}: ${contactError}`)
          }
        }
      }
      
      // Fix pipeline entries with missing amounts
      const { data: pipelineIssues, error: pipelineError } = await supabase
        .from('pipeline_entries')
        .select('id, amount, stage, lead_id')
        .or('amount.is.null,amount.eq.0')
      
      if (pipelineError) {
        console.error('❌ Error fetching pipeline entries:', pipelineError)
        result.errors.push(`Failed to fetch pipeline entries: ${pipelineError.message}`)
      } else if (pipelineIssues && pipelineIssues.length > 0) {
        console.log(`📋 Found ${pipelineIssues.length} pipeline entries with missing amounts`)
        
        for (const pipeline of pipelineIssues) {
          try {
            let defaultAmount = 50000 // Default amount
            
            // Set amount based on stage
            if (pipeline.stage) {
              switch (pipeline.stage.toLowerCase()) {
                case 'application':
                case 'qualified':
                  defaultAmount = 100000
                  break
                case 'loan approved':
                case 'documentation':
                case 'closing':
                  defaultAmount = 250000
                  break
                case 'funded':
                  defaultAmount = 500000
                  break
              }
            }
            
            console.log(`🔨 Fixing pipeline entry ${pipeline.id}: Setting amount to $${defaultAmount}`)
            
            const { error: updateError } = await supabase
              .from('pipeline_entries')
              .update({ amount: defaultAmount })
              .eq('id', pipeline.id)
            
            if (!updateError) {
              result.fixed++
              console.log(`✅ Successfully fixed pipeline entry ${pipeline.id}`)
            } else {
              console.error(`❌ Failed to fix pipeline entry:`, updateError)
              result.errors.push(`Failed to fix pipeline entry: ${updateError.message}`)
            }
          } catch (pipelineError) {
            console.error(`❌ Exception fixing pipeline entry:`, pipelineError)
            result.errors.push(`Exception fixing pipeline entry: ${pipelineError}`)
          }
        }
      }
      
      console.log(`🎉 Auto-fix completed: ${result.fixed} fixes, ${result.errors.length} errors`)
      
      if (result.fixed === 0 && result.errors.length === 0) {
        result.errors.push('No data integrity issues found for your records.')
      }
      
      return result
    } catch (error) {
      console.error('❌ Auto-fix failed:', error)
      result.errors.push(`Auto-fix failed: ${error}`)
      return result
    }
  }
}