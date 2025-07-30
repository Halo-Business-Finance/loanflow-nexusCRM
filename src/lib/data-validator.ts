import { supabase } from "@/integrations/supabase/client";

interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedFields: string[];
}

interface FieldMapping {
  source: string;
  target: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
}

// Define comprehensive field mappings for all major entities
const LEAD_FIELD_MAPPINGS: FieldMapping[] = [
  { source: 'name', target: 'name', type: 'string', required: true },
  { source: 'email', target: 'email', type: 'string', required: true },
  { source: 'phone', target: 'phone', type: 'string' },
  { source: 'phone_number', target: 'phone', type: 'string' }, // Handle phone_number -> phone mapping
  { source: 'location', target: 'location', type: 'string' },
  { source: 'business_name', target: 'business_name', type: 'string' },
  { source: 'businessName', target: 'business_name', type: 'string' }, // Handle camelCase -> snake_case
  { source: 'business_address', target: 'business_address', type: 'string' },
  { source: 'loan_amount', target: 'loan_amount', type: 'number' },
  { source: 'loanAmount', target: 'loan_amount', type: 'number' }, // Handle camelCase -> snake_case
  { source: 'loan_type', target: 'loan_type', type: 'string' },
  { source: 'credit_score', target: 'credit_score', type: 'number' },
  { source: 'creditScore', target: 'credit_score', type: 'number' }, // Handle camelCase -> snake_case
  { source: 'annual_revenue', target: 'annual_revenue', type: 'number' },
  { source: 'annualRevenue', target: 'annual_revenue', type: 'number' }, // Handle camelCase -> snake_case
  { source: 'net_operating_income', target: 'net_operating_income', type: 'number' },
  { source: 'existing_loan_amount', target: 'existing_loan_amount', type: 'number' },
  { source: 'pos_system', target: 'pos_system', type: 'string' },
  { source: 'monthly_processing_volume', target: 'monthly_processing_volume', type: 'number' },
  { source: 'average_transaction_size', target: 'average_transaction_size', type: 'number' },
  { source: 'processor_name', target: 'processor_name', type: 'string' },
  { source: 'current_processing_rate', target: 'current_processing_rate', type: 'number' },
  { source: 'bdo_name', target: 'bdo_name', type: 'string' },
  { source: 'bdoName', target: 'bdo_name', type: 'string' }, // Handle camelCase -> snake_case
  { source: 'bdo_telephone', target: 'bdo_telephone', type: 'string' },
  { source: 'bdoTelephone', target: 'bdo_telephone', type: 'string' }, // Handle camelCase -> snake_case
  { source: 'bdo_email', target: 'bdo_email', type: 'string' },
  { source: 'bdoEmail', target: 'bdo_email', type: 'string' }, // Handle camelCase -> snake_case
  { source: 'stage', target: 'stage', type: 'string' },
  { source: 'priority', target: 'priority', type: 'string' },
  { source: 'notes', target: 'notes', type: 'string' },
  { source: 'call_notes', target: 'call_notes', type: 'string' }
];

const CLIENT_FIELD_MAPPINGS: FieldMapping[] = [
  ...LEAD_FIELD_MAPPINGS,
  { source: 'status', target: 'status', type: 'string' },
  { source: 'total_loans', target: 'total_loans', type: 'number' },
  { source: 'total_loan_value', target: 'total_loan_value', type: 'number' },
  { source: 'join_date', target: 'join_date', type: 'date' },
  { source: 'last_activity', target: 'last_activity', type: 'date' }
];

export class DataFieldValidator {
  
  /**
   * Validates that all data fields are correctly mapped and typed
   */
  static async validateLeadData(leadData: any): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixedFields: []
    };

    // Check for required fields
    const requiredFields = LEAD_FIELD_MAPPINGS.filter(m => m.required);
    for (const field of requiredFields) {
      if (!leadData[field.source] || leadData[field.source] === '') {
        result.errors.push(`Required field '${field.source}' is missing or empty`);
        result.isValid = false;
      }
    }

    // Validate field types and values
    for (const mapping of LEAD_FIELD_MAPPINGS) {
      const value = leadData[mapping.source];
      if (value !== null && value !== undefined && value !== '') {
        const validation = this.validateFieldType(value, mapping.type, mapping.source);
        if (!validation.isValid) {
          result.warnings.push(validation.error);
        }
      }
    }

    // Check for missing POS fields that should be grouped
    const posFields = ['pos_system', 'monthly_processing_volume', 'average_transaction_size', 'processor_name', 'current_processing_rate'];
    const hasSomePosData = posFields.some(field => leadData[field]);
    const hasAllPosData = posFields.every(field => leadData[field]);
    
    if (hasSomePosData && !hasAllPosData) {
      result.warnings.push('Incomplete POS information - some fields are missing');
    }

    // Validate email format
    if (leadData.email && !this.isValidEmail(leadData.email)) {
      result.errors.push('Invalid email format');
      result.isValid = false;
    }

    // Validate phone format
    if (leadData.phone && !this.isValidPhoneNumber(leadData.phone)) {
      result.warnings.push('Phone number format may be invalid');
    }

    // Check for data consistency
    if (leadData.loan_amount && leadData.existing_loan_amount) {
      if (leadData.existing_loan_amount > leadData.loan_amount) {
        result.warnings.push('Existing loan amount is greater than requested loan amount');
      }
    }

    return result;
  }

  /**
   * Validates client data during conversion from lead
   */
  static async validateClientConversion(leadData: any, clientData: any): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixedFields: []
    };

    // Ensure all lead data is properly transferred
    for (const mapping of LEAD_FIELD_MAPPINGS) {
      const leadValue = leadData[mapping.source];
      const clientValue = clientData[mapping.target];
      
      if (leadValue && !clientValue) {
        result.warnings.push(`Lead field '${mapping.source}' not transferred to client`);
        result.fixedFields.push(mapping.source);
      }
    }

    // Validate business logic
    if (clientData.total_loans < 0) {
      result.errors.push('Total loans cannot be negative');
      result.isValid = false;
    }

    if (clientData.total_loan_value < 0) {
      result.errors.push('Total loan value cannot be negative');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validates pipeline entry data
   */
  static async validatePipelineEntry(entryData: any): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixedFields: []
    };

    // Required fields for pipeline entries
    if (!entryData.stage) {
      result.errors.push('Pipeline stage is required');
      result.isValid = false;
    }

    if (!entryData.amount || entryData.amount <= 0) {
      result.errors.push('Pipeline amount must be greater than 0');
      result.isValid = false;
    }

    // Validate stage values
    const validStages = ['Initial Contact', 'Qualified', 'Application', 'Pre-approval', 'Documentation', 'Closing', 'Funded'];
    if (entryData.stage && !validStages.includes(entryData.stage)) {
      result.warnings.push(`Unusual pipeline stage: ${entryData.stage}`);
    }

    return result;
  }

  /**
   * Performs a comprehensive CRM data audit
   */
  static async performDataAudit(): Promise<{
    leadIssues: any[];
    clientIssues: any[];
    pipelineIssues: any[];
    summary: {
      totalIssues: number;
      criticalIssues: number;
      warningIssues: number;
    };
  }> {
    console.log('Starting comprehensive CRM data audit...');
    
    const leadIssues: any[] = [];
    const clientIssues: any[] = [];
    const pipelineIssues: any[] = [];

    try {
      // Audit leads
      const { data: leads } = await supabase.from('leads').select('*');
      if (leads) {
        for (const lead of leads) {
          const validation = await this.validateLeadData(lead);
          if (!validation.isValid || validation.warnings.length > 0) {
            leadIssues.push({
              id: lead.id,
              name: lead.name,
              validation
            });
          }
        }
      }

      // Audit clients
      const { data: clients } = await supabase.from('clients').select('*');
      if (clients) {
        for (const client of clients) {
          const validation = await this.validateLeadData(client); // Using same validation for shared fields
          if (!validation.isValid || validation.warnings.length > 0) {
            clientIssues.push({
              id: client.id,
              name: client.name,
              validation
            });
          }
        }
      }

      // Audit pipeline entries
      const { data: pipelineEntries } = await supabase.from('pipeline_entries').select('*');
      if (pipelineEntries) {
        for (const entry of pipelineEntries) {
          const validation = await this.validatePipelineEntry(entry);
          if (!validation.isValid || validation.warnings.length > 0) {
            pipelineIssues.push({
              id: entry.id,
              stage: entry.stage,
              validation
            });
          }
        }
      }

      const totalIssues = leadIssues.length + clientIssues.length + pipelineIssues.length;
      const criticalIssues = [...leadIssues, ...clientIssues, ...pipelineIssues]
        .filter(issue => !issue.validation.isValid).length;
      const warningIssues = totalIssues - criticalIssues;

      return {
        leadIssues,
        clientIssues,
        pipelineIssues,
        summary: {
          totalIssues,
          criticalIssues,
          warningIssues
        }
      };

    } catch (error) {
      console.error('Error during data audit:', error);
      throw error;
    }
  }

  /**
   * Auto-fixes common data field issues
   */
  static async autoFixDataIssues(): Promise<{
    fixed: number;
    errors: string[];
  }> {
    const result = { fixed: 0, errors: [] };

    try {
      // Fix phone number formatting
      const { data: leadsWithPhones } = await supabase
        .from('leads')
        .select('id, phone')
        .not('phone', 'is', null);

      if (leadsWithPhones) {
        for (const lead of leadsWithPhones) {
          const formattedPhone = this.formatPhoneNumber(lead.phone);
          if (formattedPhone !== lead.phone) {
            const { error } = await supabase
              .from('leads')
              .update({ phone: formattedPhone })
              .eq('id', lead.id);
            
            if (!error) {
              result.fixed++;
            } else {
              result.errors.push(`Failed to fix phone for lead ${lead.id}: ${error.message}`);
            }
          }
        }
      }

      // Fix email formatting (lowercase)
      const { data: leadsWithEmails } = await supabase
        .from('leads')
        .select('id, email')
        .not('email', 'is', null);

      if (leadsWithEmails) {
        for (const lead of leadsWithEmails) {
          const normalizedEmail = lead.email.toLowerCase().trim();
          if (normalizedEmail !== lead.email) {
            const { error } = await supabase
              .from('leads')
              .update({ email: normalizedEmail })
              .eq('id', lead.id);
            
            if (!error) {
              result.fixed++;
            } else {
              result.errors.push(`Failed to fix email for lead ${lead.id}: ${error.message}`);
            }
          }
        }
      }

      // Fix null values that should be zeros - using direct SQL call
      try {
        const { error: fixNullsError } = await supabase
          .from('leads')
          .update({ loan_amount: 0 })
          .is('loan_amount', null)
          .in('stage', ['Application', 'Pre-approval', 'Documentation', 'Closing']);
        
        if (!fixNullsError) {
          result.fixed += 1; // Count as one bulk fix operation
        }
      } catch (error) {
        result.errors.push(`Failed to fix null loan amounts: ${error}`);
      }

    } catch (error) {
      result.errors.push(`Auto-fix error: ${error}`);
    }

    return result;
  }

  // Helper methods
  private static validateFieldType(value: any, expectedType: string, fieldName: string): { isValid: boolean; error: string } {
    switch (expectedType) {
      case 'number':
        if (isNaN(Number(value))) {
          return { isValid: false, error: `Field '${fieldName}' should be a number but got '${value}'` };
        }
        break;
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, error: `Field '${fieldName}' should be a string but got ${typeof value}` };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: `Field '${fieldName}' should be a boolean but got ${typeof value}` };
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          return { isValid: false, error: `Field '${fieldName}' should be a valid date but got '${value}'` };
        }
        break;
    }
    return { isValid: true, error: '' };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Should be 10 digits for US numbers
    return digits.length === 10;
  }

  private static formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digits
    const phoneNumber = phone.replace(/\D/g, '');
    
    // Format based on length
    if (phoneNumber.length < 4) {
      return phoneNumber;
    } else if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  }
}