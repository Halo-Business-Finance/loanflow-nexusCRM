import { supabase } from "@/integrations/supabase/client"

interface DataValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface FieldMapping {
  source: string
  target: string
  type: 'string' | 'number' | 'boolean' | 'date'
  required: boolean
}

// Lead field mappings for the new inheritance structure
const LEAD_FIELD_MAPPINGS: FieldMapping[] = [
  { source: 'name', target: 'name', type: 'string', required: true },
  { source: 'email', target: 'email', type: 'string', required: true },
  { source: 'phone', target: 'phone', type: 'string', required: false },
  { source: 'location', target: 'location', type: 'string', required: false },
  { source: 'stage', target: 'stage', type: 'string', required: false },
  { source: 'priority', target: 'priority', type: 'string', required: false },
  { source: 'loan_amount', target: 'loan_amount', type: 'number', required: false },
  { source: 'loan_type', target: 'loan_type', type: 'string', required: false },
  { source: 'credit_score', target: 'credit_score', type: 'number', required: false },
  { source: 'annual_revenue', target: 'annual_revenue', type: 'number', required: false },
  { source: 'business_name', target: 'business_name', type: 'string', required: false },
  { source: 'business_address', target: 'business_address', type: 'string', required: false },
  { source: 'year_established', target: 'year_established', type: 'number', required: false },
  { source: 'owns_property', target: 'owns_property', type: 'boolean', required: false },
  { source: 'notes', target: 'notes', type: 'string', required: false },
  { source: 'call_notes', target: 'call_notes', type: 'string', required: false }
]

// Client field mappings extend lead mappings
const CLIENT_FIELD_MAPPINGS: FieldMapping[] = [
  ...LEAD_FIELD_MAPPINGS,
  { source: 'status', target: 'status', type: 'string', required: false },
  { source: 'join_date', target: 'join_date', type: 'date', required: false },
  { source: 'last_activity', target: 'last_activity', type: 'date', required: false }
]

export class DataFieldValidator {
  async validateLeadData(leadData: any): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Handle both nested contact_entities and direct contact entity data
    const contactEntity = leadData.contact_entities || leadData.contact_entity || leadData
    
    // If no contact entity data exists, that's a critical error
    if (!contactEntity || (leadData.contact_entities === null && leadData.contact_entity_id)) {
      result.errors.push('Missing contact entity data')
      result.isValid = false
      return result
    }
    
    // Check required fields from contact entity
    if (!contactEntity?.name) {
      result.errors.push('Name is required')
      result.isValid = false
    }

    if (!contactEntity?.email) {
      result.errors.push('Email is required')
      result.isValid = false
    }

    // Validate email format
    if (contactEntity?.email && !this.isValidEmail(contactEntity.email)) {
      result.errors.push('Invalid email format')
      result.isValid = false
    }

    // Validate phone format
    if (contactEntity?.phone && !this.isValidPhoneNumber(contactEntity.phone)) {
      result.warnings.push('Phone number format may be invalid')
    }

    // Check for missing important business fields
    if (contactEntity?.loan_amount && contactEntity.loan_amount > 100000 && !contactEntity.business_name) {
      result.warnings.push('Large loan amount without business name specified')
    }

    // Validate loan amount consistency
    if (contactEntity?.loan_amount && contactEntity.loan_amount < 0) {
      result.errors.push('Loan amount cannot be negative')
      result.isValid = false
    }

    return result
  }

  async validateClientConversion(leadData: any, clientData: any): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Handle both nested contact_entities and direct contact entity data
    const leadContactEntity = leadData.contact_entities || leadData.contact_entity || leadData
    const clientContactEntity = clientData.contact_entities || clientData.contact_entity || clientData

    // Check that essential data transferred from lead to client
    if (leadContactEntity?.name !== clientContactEntity?.name) {
      result.warnings.push('Name differs between lead and client')
    }

    if (leadContactEntity?.email !== clientContactEntity?.email) {
      result.warnings.push('Email differs between lead and client')
    }

    // Business logic checks
    if (leadContactEntity?.stage !== 'Funded' && leadContactEntity?.stage !== 'Closed') {
      result.warnings.push('Converting lead that is not in Funded or Closed stage')
    }

    return result
  }

  async validatePipelineEntry(entryData: any): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Check required fields
    if (!entryData.stage) {
      result.errors.push('Stage is required for pipeline entry')
      result.isValid = false
    }

    if (!entryData.amount || entryData.amount <= 0) {
      result.errors.push('Valid amount is required for pipeline entry')
      result.isValid = false
    }

    // Validate stage
    const validStages = ['New Lead', 'Lead', 'Qualified', 'Application', 'Loan Approved', 'Documentation', 'Closing', 'Funded', 'Rejected']
    if (entryData.stage && !validStages.includes(entryData.stage)) {
      result.warnings.push(`Stage '${entryData.stage}' is not a standard pipeline stage`)
    }

    return result
  }

  async performDataAudit(): Promise<{
    leadIssues: Array<{ id: string; name: string; validation: DataValidationResult }>
    clientIssues: Array<{ id: string; name: string; validation: DataValidationResult }>
    pipelineIssues: Array<{ id: string; stage: string; validation: DataValidationResult }>
    summary: {
      totalLeads: number
      leadsWithIssues: number
      totalClients: number
      clientsWithIssues: number
      totalPipelineEntries: number
      pipelineEntriesWithIssues: number
      totalIssues: number
      criticalIssues: number
      warningIssues: number
    }
  }> {
    const leadIssues: Array<{ id: string; name: string; validation: DataValidationResult }> = []
    const clientIssues: Array<{ id: string; name: string; validation: DataValidationResult }> = []
    const pipelineIssues: Array<{ id: string; stage: string; validation: DataValidationResult }> = []

    try {
      // Audit leads with contact entity data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          contact_entity_id,
          user_id,
          last_contact,
          created_at,
          updated_at,
          is_converted_to_client,
          converted_at,
          contact_entities (
            name,
            email,
            phone,
            business_name,
            loan_amount,
            loan_type,
            stage,
            priority,
            credit_score,
            annual_revenue,
            business_address,
            year_established,
            owns_property,
            notes,
            call_notes
          )
        `)
      
      if (leadsError) {
        console.error('Error fetching leads:', leadsError)
        throw new Error(`Failed to fetch leads: ${leadsError.message}`)
      }
      
      if (leads) {
        for (const lead of leads) {
          console.log('Lead data structure:', lead);
          console.log('Contact entities:', lead.contact_entities);
          const validation = await this.validateLeadData(lead)
          if (!validation.isValid || validation.warnings.length > 0) {
            leadIssues.push({
              id: lead.id,
              name: lead.contact_entities?.name || 'Unknown',
              validation
            })
          }
        }
      }

      // Audit clients with contact entity data
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          contact_entity_id,
          user_id,
          status,
          total_loans,
          total_loan_value,
          join_date,
          last_activity,
          created_at,
          updated_at,
          lead_id,
          contact_entities (
            name,
            email,
            phone,
            business_name,
            loan_amount,
            loan_type,
            stage,
            priority,
            credit_score,
            annual_revenue,
            business_address,
            year_established,
            owns_property,
            notes,
            call_notes
          )
        `)
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
        throw new Error(`Failed to fetch clients: ${clientsError.message}`)
      }
      
      if (clients) {
        for (const client of clients) {
          const validation = await this.validateLeadData(client) // Using same validation for shared fields
          if (!validation.isValid || validation.warnings.length > 0) {
            clientIssues.push({
              id: client.id,
              name: client.contact_entities?.name || 'Unknown',
              validation
            })
          }
        }
      }

      // Audit pipeline entries
      const { data: pipelineEntries, error: pipelineError } = await supabase.from('pipeline_entries').select('*')
      
      if (pipelineError) {
        console.error('Error fetching pipeline entries:', pipelineError)
        throw new Error(`Failed to fetch pipeline entries: ${pipelineError.message}`)
      }
      if (pipelineEntries) {
        for (const entry of pipelineEntries) {
          const validation = await this.validatePipelineEntry(entry)
          if (!validation.isValid || validation.warnings.length > 0) {
            pipelineIssues.push({
              id: entry.id,
              stage: entry.stage,
              validation
            })
          }
        }
      }

      return {
        leadIssues,
        clientIssues,
        pipelineIssues,
        summary: {
          totalLeads: leads?.length || 0,
          leadsWithIssues: leadIssues.length,
          totalClients: clients?.length || 0,
          clientsWithIssues: clientIssues.length,
          totalPipelineEntries: pipelineEntries?.length || 0,
          pipelineEntriesWithIssues: pipelineIssues.length,
          totalIssues: leadIssues.length + clientIssues.length + pipelineIssues.length,
          criticalIssues: [...leadIssues, ...clientIssues, ...pipelineIssues].filter(issue => 
            issue.validation.errors.length > 0
          ).length,
          warningIssues: [...leadIssues, ...clientIssues, ...pipelineIssues].filter(issue => 
            issue.validation.warnings.length > 0 && issue.validation.errors.length === 0
          ).length
        }
      }
    } catch (error) {
      console.error('Error performing data audit:', error)
      throw error
    }
  }

  async autoFixDataIssues(): Promise<{ fixed: number; errors: string[] }> {
    const result = { fixed: 0, errors: [] }

    try {
      console.log('Starting Auto-Fix Data Issues...')
      
      // Note: Contact entities now have fortress-level security with encrypted fields
      // Auto-fix will focus on non-sensitive data integrity issues
      
      // Fix pipeline entries with missing or invalid amounts
      const { data: pipelineIssues } = await supabase
        .from('pipeline_entries')
        .select('id, amount, lead_id')
        .or('amount.is.null,amount.eq.0')
        
      console.log('Found pipeline issues:', pipelineIssues?.length || 0)

      if (pipelineIssues) {
        for (const pipeline of pipelineIssues) {
          // Try to get amount from related lead's contact entity
          if (pipeline.lead_id) {
            const { data: leadData } = await supabase
              .from('leads')
              .select(`
                contact_entities!inner (
                  loan_amount
                )
              `)
              .eq('id', pipeline.lead_id)
              .single()
              
            if (leadData && leadData.contact_entities?.loan_amount && leadData.contact_entities.loan_amount > 0) {
              const { error } = await supabase
                .from('pipeline_entries')
                .update({ amount: leadData.contact_entities.loan_amount })
                .eq('id', pipeline.id)
              
              if (!error) {
                result.fixed++
                console.log(`Fixed pipeline ${pipeline.id} amount from contact entity data`)
              } else {
                result.errors.push(`Failed to fix pipeline ${pipeline.id}: ${error.message}`)
              }
            }
          } else {
            // Set default amount for pipeline entries without lead association
            const { error } = await supabase
              .from('pipeline_entries')
              .update({ amount: 1000 })
              .eq('id', pipeline.id)
            
            if (!error) {
              result.fixed++
              console.log(`Fixed pipeline ${pipeline.id} with default amount`)
            } else {
              result.errors.push(`Failed to fix pipeline ${pipeline.id}: ${error.message}`)
            }
          }
        }
      }

      // Fix clients with missing status
      const { data: clientsWithoutStatus } = await supabase
        .from('clients')
        .select('id')
        .is('status', null)
        
      console.log('Found clients without status:', clientsWithoutStatus?.length || 0)

      if (clientsWithoutStatus) {
        for (const client of clientsWithoutStatus) {
          const { error } = await supabase
            .from('clients')
            .update({ status: 'Active' })
            .eq('id', client.id)
          
          if (!error) {
            result.fixed++
            console.log(`Fixed client ${client.id} status`)
          } else {
            result.errors.push(`Failed to fix client status ${client.id}: ${error.message}`)
          }
        }
      }

      // Fix loan requests with invalid or missing statuses
      const { data: invalidLoanRequests } = await supabase
        .from('loan_requests')
        .select('id, status')
        .or('status.is.null,status.eq.""')
        
      console.log('Found invalid loan requests:', invalidLoanRequests?.length || 0)

      if (invalidLoanRequests) {
        for (const loanRequest of invalidLoanRequests) {
          const { error } = await supabase
            .from('loan_requests')
            .update({ status: 'pending' })
            .eq('id', loanRequest.id)
          
          if (!error) {
            result.fixed++
            console.log(`Fixed loan request ${loanRequest.id} status`)
          } else {
            result.errors.push(`Failed to fix loan request status ${loanRequest.id}: ${error.message}`)
          }
        }
      }

      console.log(`Auto-fix completed. Fixed: ${result.fixed}, Errors: ${result.errors.length}`)
      
      // Add info about contact entities security
      if (result.fixed === 0 && result.errors.length === 0) {
        result.errors.push('Note: Contact entities are now secured with fortress-level encryption. Sensitive data auto-fixes are handled by security triggers.')
      }

      return result
    } catch (error) {
      console.error('Error in auto-fix:', error)
      result.errors.push(`Auto-fix failed: ${error}`)
      return result
    }
  }

  private validateFieldType(value: any, expectedType: string, fieldName: string): { isValid: boolean; error: string } {
    if (value === null || value === undefined) {
      return { isValid: true, error: '' } // Nullable fields are OK
    }

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, error: `${fieldName} must be a string` }
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, error: `${fieldName} must be a valid number` }
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: `${fieldName} must be a boolean` }
        }
        break
      case 'date':
        if (!(value instanceof Date) && typeof value !== 'string') {
          return { isValid: false, error: `${fieldName} must be a valid date` }
        }
        break
    }

    return { isValid: true, error: '' }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    // US phone numbers should be 10 or 11 digits (with or without country code)
    return cleaned.length === 10 || cleaned.length === 11
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX for 10-digit numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    
    // Format as +1 (XXX) XXX-XXXX for 11-digit numbers starting with 1
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    
    // Return original if not a standard format
    return phone
  }
}