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
        .select('id, loan_amount, business_name, name, phone')
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

      // Fix contacts with large loan amounts but missing business names
      const { data: largeLoans, error: largeLoansError } = await supabase
        .from('contact_entities')
        .select('id, name, loan_amount, business_name')
        .gt('loan_amount', 100000)
        .or('business_name.is.null,business_name.eq.""')
      
      if (largeLoansError) {
        console.error('❌ Error fetching large loans:', largeLoansError)
      } else if (largeLoans && largeLoans.length > 0) {
        console.log(`📋 Found ${largeLoans.length} large loans without business names`)
        
        for (const contact of largeLoans) {
          try {
            // Generate a reasonable business name based on the contact name
            const businessName = contact.name ? `${contact.name} Business` : 'Business Entity'
            
            console.log(`🔨 Adding business name to ${contact.name}: ${businessName}`)
            
            const { error: updateError } = await supabase
              .from('contact_entities')
              .update({ business_name: businessName })
              .eq('id', contact.id)
            
            if (!updateError) {
              result.fixed++
              console.log(`✅ Successfully added business name for ${contact.name}`)
            } else {
              console.error(`❌ Failed to add business name:`, updateError)
              result.errors.push(`Failed to add business name: ${updateError.message}`)
            }
          } catch (error) {
            console.error(`❌ Exception adding business name:`, error)
            result.errors.push(`Exception adding business name: ${error}`)
          }
        }
      }

      // Fix contacts with invalid phone number formats
      const { data: phoneContacts, error: phoneError } = await supabase
        .from('contact_entities')
        .select('id, name, phone')
        .not('phone', 'is', null)
        .neq('phone', '')
      
      if (phoneError) {
        console.error('❌ Error fetching phone contacts:', phoneError)
      } else if (phoneContacts && phoneContacts.length > 0) {
        console.log(`📋 Checking ${phoneContacts.length} contacts for phone format issues`)
        
        for (const contact of phoneContacts) {
          try {
            const phone = contact.phone
            // Check if phone needs formatting (only digits, no formatting)
            if (phone && /^\d{10}$/.test(phone.replace(/\D/g, ''))) {
              const digits = phone.replace(/\D/g, '')
              if (digits.length === 10) {
                const formattedPhone = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                
                if (formattedPhone !== phone) {
                  console.log(`🔨 Formatting phone for ${contact.name}: ${phone} → ${formattedPhone}`)
                  
                  const { error: updateError } = await supabase
                    .from('contact_entities')
                    .update({ phone: formattedPhone })
                    .eq('id', contact.id)
                  
                  if (!updateError) {
                    result.fixed++
                    console.log(`✅ Successfully formatted phone for ${contact.name}`)
                  } else {
                    console.error(`❌ Failed to format phone:`, updateError)
                    result.errors.push(`Failed to format phone: ${updateError.message}`)
                  }
                }
              }
            }
          } catch (error) {
            console.error(`❌ Exception formatting phone:`, error)
            result.errors.push(`Exception formatting phone: ${error}`)
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