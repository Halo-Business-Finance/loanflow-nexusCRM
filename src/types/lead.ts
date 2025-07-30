export interface Lead {
  id: string
  contact_entity_id: string
  user_id: string
  name: string
  email: string
  phone?: string
  location?: string
  business_name?: string
  naics_code?: string
  ownership_structure?: string
  loan_amount?: number
  loan_type?: string
  stage: string
  priority: string
  credit_score?: number
  net_operating_income?: number
  last_contact: string
  is_converted_to_client: boolean
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
  "Qualified", 
  "Application", 
  "Pre-approval", 
  "Documentation", 
  "Closing", 
  "Funded", 
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