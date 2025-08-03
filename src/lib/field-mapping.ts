import { Lead, Client, ContactEntity } from "@/types/lead"

/**
 * Maps contact entity fields to lead object for consistent access
 */
export function mapLeadFields(lead: any): Lead {
  const mappedLead: Lead = {
    ...lead,
    // Map contact entity fields to lead for convenience
    name: lead.contact_entity?.name || lead.name || '',
    email: lead.contact_entity?.email || lead.email || '',
    phone: lead.contact_entity?.phone || lead.phone || '',
    location: lead.contact_entity?.location || lead.location || '',
    business_name: lead.contact_entity?.business_name || lead.business_name || '',
    business_address: lead.contact_entity?.business_address || lead.business_address || '',
    naics_code: lead.contact_entity?.naics_code || lead.naics_code || '',
    ownership_structure: lead.contact_entity?.ownership_structure || lead.ownership_structure || '',
    owns_property: lead.contact_entity?.owns_property ?? lead.owns_property ?? false,
    property_payment_amount: lead.contact_entity?.property_payment_amount ?? lead.property_payment_amount ?? 0,
    year_established: lead.contact_entity?.year_established ?? lead.year_established,
    loan_amount: lead.contact_entity?.loan_amount ?? lead.loan_amount ?? 0,
    loan_type: lead.contact_entity?.loan_type || lead.loan_type || '',
    stage: lead.contact_entity?.stage || lead.stage || 'New',
    priority: lead.contact_entity?.priority || lead.priority || 'medium',
    credit_score: lead.contact_entity?.credit_score ?? lead.credit_score,
    net_operating_income: lead.contact_entity?.net_operating_income ?? lead.net_operating_income,
    bank_lender_name: lead.contact_entity?.bank_lender_name || lead.bank_lender_name || '',
    annual_revenue: lead.contact_entity?.annual_revenue ?? lead.annual_revenue,
    interest_rate: lead.contact_entity?.interest_rate ?? lead.interest_rate,
    maturity_date: lead.contact_entity?.maturity_date || lead.maturity_date || '',
    existing_loan_amount: lead.contact_entity?.existing_loan_amount ?? lead.existing_loan_amount,
    notes: lead.contact_entity?.notes || lead.notes || '',
    call_notes: lead.contact_entity?.call_notes || lead.call_notes || '',
    income: lead.contact_entity?.income ?? lead.income,
    bdo_name: lead.contact_entity?.bdo_name || lead.bdo_name || '',
    bdo_telephone: lead.contact_entity?.bdo_telephone || lead.bdo_telephone || '',
    bdo_email: lead.contact_entity?.bdo_email || lead.bdo_email || ''
  }
  
  return mappedLead
}

/**
 * Maps contact entity fields to client object for consistent access
 */
export function mapClientFields(client: any): Client {
  const mappedClient: Client = {
    ...client,
    // Map contact entity fields to client for convenience
    name: client.contact_entity?.name || client.name || '',
    email: client.contact_entity?.email || client.email || '',
    phone: client.contact_entity?.phone || client.phone || '',
    location: client.contact_entity?.location || client.location || '',
    business_name: client.contact_entity?.business_name || client.business_name || ''
  }
  
  return mappedClient
}

/**
 * Extracts contact entity data from lead/client for database operations
 */
export function extractContactEntityData(data: any): Partial<ContactEntity> {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    business_name: data.business_name,
    business_address: data.business_address,
    naics_code: data.naics_code,
    ownership_structure: data.ownership_structure,
    owns_property: data.owns_property,
    property_payment_amount: data.property_payment_amount,
    year_established: data.year_established,
    loan_amount: data.loan_amount,
    loan_type: data.loan_type,
    stage: data.stage,
    priority: data.priority,
    credit_score: data.credit_score,
    net_operating_income: data.net_operating_income,
    annual_revenue: data.annual_revenue,
    interest_rate: data.interest_rate,
    maturity_date: data.maturity_date,
    existing_loan_amount: data.existing_loan_amount,
    notes: data.notes,
    call_notes: data.call_notes,
    income: data.income,
    bdo_name: data.bdo_name,
    bdo_telephone: data.bdo_telephone,
    bdo_email: data.bdo_email
  }
}

/**
 * Standard query fragment for fetching leads with contact entities
 */
export const LEAD_WITH_CONTACT_QUERY = `
  *,
  contact_entity:contact_entities!contact_entity_id (*)
`

/**
 * Standard query fragment for fetching clients with contact entities
 */
export const CLIENT_WITH_CONTACT_QUERY = `
  *,
  contact_entity:contact_entities!contact_entity_id (*)
`