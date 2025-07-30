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

    // Handle both nested contact_entity and direct contact entity data
    const contactEntity = leadData.contact_entity || leadData
    
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

    // Handle both nested contact_entity and direct contact entity data
    const leadContactEntity = leadData.contact_entity || leadData
    const clientContactEntity = clientData.contact_entity || clientData

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
    const validStages = ['Lead', 'Qualified', 'Application', 'Pre-approval', 'Documentation', 'Closing', 'Funded', 'Rejected']
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
    }
  }> {
    const leadIssues: Array<{ id: string; name: string; validation: DataValidationResult }> = []
    const clientIssues: Array<{ id: string; name: string; validation: DataValidationResult }> = []
    const pipelineIssues: Array<{ id: string; stage: string; validation: DataValidationResult }> = []

    try {
      // Audit leads with contact entity data
      const { data: leads } = await supabase
        .from('leads')
        .select(`
          *,
          contact_entity:contact_entities!contact_entity_id (*)
        `)
      
      if (leads) {
        for (const lead of leads) {
          const validation = await this.validateLeadData(lead)
          if (!validation.isValid || validation.warnings.length > 0) {
            leadIssues.push({
              id: lead.id,
              name: lead.contact_entity?.name || 'Unknown',
              validation
            })
          }
        }
      }

      // Audit clients with contact entity data
      const { data: clients } = await supabase
        .from('clients')
        .select(`
          *,
          contact_entity:contact_entities!contact_entity_id (*)
        `)
      
      if (clients) {
        for (const client of clients) {
          const validation = await this.validateLeadData(client) // Using same validation for shared fields
          if (!validation.isValid || validation.warnings.length > 0) {
            clientIssues.push({
              id: client.id,
              name: client.contact_entity?.name || 'Unknown',
              validation
            })
          }
        }
      }

      // Audit pipeline entries
      const { data: pipelineEntries } = await supabase.from('pipeline_entries').select('*')
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
          pipelineEntriesWithIssues: pipelineIssues.length
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
      // Fix phone number formats in contact_entities
      const { data: contactsWithPhones } = await supabase
        .from('contact_entities')
        .select('id, phone')
        .not('phone', 'is', null)

      if (contactsWithPhones) {
        for (const contact of contactsWithPhones) {
          const formattedPhone = this.formatPhoneNumber(contact.phone)
          if (formattedPhone !== contact.phone) {
            const { error } = await supabase
              .from('contact_entities')
              .update({ phone: formattedPhone })
              .eq('id', contact.id)
            
            if (!error) {
              result.fixed++
            } else {
              result.errors.push(`Failed to fix phone for contact ${contact.id}: ${error.message}`)
            }
          }
        }
      }

      // Fix email casing in contact_entities 
      const { data: contactsWithEmails } = await supabase
        .from('contact_entities')
        .select('id, email')
        .not('email', 'is', null)

      if (contactsWithEmails) {
        for (const contact of contactsWithEmails) {
          const lowercaseEmail = contact.email.toLowerCase()
          if (lowercaseEmail !== contact.email) {
            const { error } = await supabase
              .from('contact_entities')
              .update({ email: lowercaseEmail })
              .eq('id', contact.id)
            
            if (!error) {
              result.fixed++
            } else {
              result.errors.push(`Failed to fix email for contact ${contact.id}: ${error.message}`)
            }
          }
        }
      }

      // Fix null loan amounts to 0 in contact_entities
      const { data: contactsWithNullAmounts } = await supabase
        .from('contact_entities')
        .select('id')
        .is('loan_amount', null)

      if (contactsWithNullAmounts) {
        for (const contact of contactsWithNullAmounts) {
          const { error } = await supabase
            .from('contact_entities')
            .update({ loan_amount: 0 })
            .eq('id', contact.id)
          
          if (!error) {
            result.fixed++
          } else {
            result.errors.push(`Failed to fix loan amount for contact ${contact.id}: ${error.message}`)
          }
        }
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