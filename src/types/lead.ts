export interface Lead {
  id: string
  contact_entity_id: string
  user_id: string
  name: string
  email: string
  phone?: string
  location?: string
  business_name?: string
  business_address?: string
  naics_code?: string
  ownership_structure?: string
  owns_property?: boolean
  property_payment_amount?: number
  year_established?: number
  loan_amount?: number
  loan_type?: string
  stage: string
  priority: string
  credit_score?: number
  net_operating_income?: number
  bank_lender_name?: string
  annual_revenue?: number
  interest_rate?: number
  maturity_date?: string
  existing_loan_amount?: number
  notes?: string
  call_notes?: string
  last_contact: string
  created_at: string
  income?: number
  is_converted_to_client: boolean
  bdo_name?: string
  bdo_telephone?: string
  bdo_email?: string
  // Team member assignments
  loan_originator_id?: string | null
  loan_processor_id?: string | null
  closer_id?: string | null
  funder_id?: string | null
}

export interface ContactEntity {
  name: string
  email: string
  phone?: string
  business_name?: string
  business_address?: string
  annual_revenue?: number
  location?: string
  loan_amount?: number
  loan_type?: string
  stage?: string
  priority?: string
  credit_score?: number
  net_operating_income?: number
  notes?: string
  naics_code?: string
  ownership_structure?: string
}

export const STAGES = [
  "All", 
  "Initial Contact", 
  "Loan Application Signed", 
  "Waiting for Documentation", 
  "Pre-Approved", 
  "Term Sheet Signed", 
  "Loan Approved", 
  "Closing", 
  "Loan Funded", 
  "Archive"
] as const

export const PRIORITIES = ["All", "High", "Medium", "Low"] as const

export const LOAN_TYPES = [
  "SBA 7(a) Loan",
  "SBA 504 Loan", 
  "Bridge Loan",
  "Conventional Loan",
  "Equipment Financing",
  "USDA B&I Loan",
  "Working Capital Loan",
  "Line of Credit",
  "Land Loan",
  "Factoring"
] as const

export type Stage = typeof STAGES[number]
export type Priority = typeof PRIORITIES[number]
export type LoanType = typeof LOAN_TYPES[number]