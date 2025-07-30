-- Create a shared contact_entities table with all common fields
CREATE TABLE public.contact_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Contact Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  
  -- Business Information
  business_name TEXT,
  business_address TEXT,
  year_established INTEGER,
  naics_code TEXT,
  ownership_structure TEXT,
  
  -- Financial Information
  annual_revenue NUMERIC,
  income NUMERIC,
  credit_score INTEGER,
  loan_amount NUMERIC,
  loan_type TEXT,
  interest_rate NUMERIC,
  maturity_date DATE,
  existing_loan_amount NUMERIC,
  net_operating_income NUMERIC,
  property_payment_amount NUMERIC,
  owns_property BOOLEAN DEFAULT false,
  
  -- POS/Processing Information
  pos_system TEXT,
  processor_name TEXT,
  current_processing_rate NUMERIC,
  monthly_processing_volume NUMERIC,
  average_transaction_size NUMERIC,
  
  -- BDO Information
  bdo_name TEXT,
  bdo_telephone TEXT,
  bdo_email TEXT,
  bank_lender_name TEXT,
  
  -- Pipeline Information
  stage TEXT,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  call_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contact_entities
ALTER TABLE public.contact_entities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact_entities
CREATE POLICY "Users can view their own contact entities" 
ON public.contact_entities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create contact entities" 
ON public.contact_entities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact entities" 
ON public.contact_entities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact entities" 
ON public.contact_entities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_contact_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_entities_updated_at
  BEFORE UPDATE ON public.contact_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_entities_updated_at();

-- Migrate existing leads data to contact_entities
INSERT INTO public.contact_entities (
  id, user_id, name, email, phone, location, business_name, business_address,
  year_established, naics_code, ownership_structure, annual_revenue, income,
  credit_score, loan_amount, loan_type, interest_rate, maturity_date,
  existing_loan_amount, net_operating_income, property_payment_amount,
  owns_property, pos_system, processor_name, current_processing_rate,
  monthly_processing_volume, average_transaction_size, bdo_name,
  bdo_telephone, bdo_email, bank_lender_name, stage, priority, notes,
  call_notes, created_at, updated_at
)
SELECT 
  id, user_id, name, email, phone, location, business_name, business_address,
  year_established, naics_code, ownership_structure, annual_revenue, income,
  credit_score, loan_amount, loan_type, interest_rate, maturity_date,
  existing_loan_amount, net_operating_income, property_payment_amount,
  owns_property, pos_system, processor_name, current_processing_rate,
  monthly_processing_volume, average_transaction_size, bdo_name,
  bdo_telephone, bdo_email, bank_lender_name, stage, priority, notes,
  call_notes, created_at, updated_at
FROM public.leads;

-- Migrate existing clients data to contact_entities
INSERT INTO public.contact_entities (
  id, user_id, name, email, phone, location, business_name, business_address,
  year_established, naics_code, ownership_structure, annual_revenue, income,
  credit_score, loan_amount, loan_type, interest_rate, maturity_date,
  existing_loan_amount, net_operating_income, property_payment_amount,
  owns_property, pos_system, processor_name, current_processing_rate,
  monthly_processing_volume, average_transaction_size, bdo_name,
  bdo_telephone, bdo_email, bank_lender_name, stage, priority, notes,
  call_notes, created_at, updated_at
)
SELECT 
  id, user_id, name, email, phone, location, business_name, business_address,
  year_established, naics_code, ownership_structure, annual_revenue, income,
  credit_score, loan_amount, loan_type, interest_rate, maturity_date,
  existing_loan_amount, net_operating_income, property_payment_amount,
  owns_property, pos_system, processor_name, current_processing_rate,
  monthly_processing_volume, average_transaction_size, bdo_name,
  bdo_telephone, bdo_email, bank_lender_name, stage, priority, notes,
  call_notes, created_at, updated_at
FROM public.clients
ON CONFLICT (id) DO NOTHING; -- Avoid duplicates if client was converted from lead

-- Add contact_entity_id to leads table
ALTER TABLE public.leads ADD COLUMN contact_entity_id UUID;
UPDATE public.leads SET contact_entity_id = id;
ALTER TABLE public.leads ALTER COLUMN contact_entity_id SET NOT NULL;

-- Add contact_entity_id to clients table  
ALTER TABLE public.clients ADD COLUMN contact_entity_id UUID;
UPDATE public.clients SET contact_entity_id = id;
ALTER TABLE public.clients ALTER COLUMN contact_entity_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE public.leads ADD CONSTRAINT fk_leads_contact_entity 
  FOREIGN KEY (contact_entity_id) REFERENCES public.contact_entities(id) ON DELETE CASCADE;

ALTER TABLE public.clients ADD CONSTRAINT fk_clients_contact_entity 
  FOREIGN KEY (contact_entity_id) REFERENCES public.contact_entities(id) ON DELETE CASCADE;

-- Remove duplicate columns from leads table
ALTER TABLE public.leads 
  DROP COLUMN name,
  DROP COLUMN email,
  DROP COLUMN phone,
  DROP COLUMN location,
  DROP COLUMN business_name,
  DROP COLUMN business_address,
  DROP COLUMN year_established,
  DROP COLUMN naics_code,
  DROP COLUMN ownership_structure,
  DROP COLUMN annual_revenue,
  DROP COLUMN income,
  DROP COLUMN credit_score,
  DROP COLUMN loan_amount,
  DROP COLUMN loan_type,
  DROP COLUMN interest_rate,
  DROP COLUMN maturity_date,
  DROP COLUMN existing_loan_amount,
  DROP COLUMN net_operating_income,
  DROP COLUMN property_payment_amount,
  DROP COLUMN owns_property,
  DROP COLUMN pos_system,
  DROP COLUMN processor_name,
  DROP COLUMN current_processing_rate,
  DROP COLUMN monthly_processing_volume,
  DROP COLUMN average_transaction_size,
  DROP COLUMN bdo_name,
  DROP COLUMN bdo_telephone,
  DROP COLUMN bdo_email,
  DROP COLUMN bank_lender_name,
  DROP COLUMN stage,
  DROP COLUMN priority,
  DROP COLUMN notes,
  DROP COLUMN call_notes;

-- Remove duplicate columns from clients table
ALTER TABLE public.clients 
  DROP COLUMN name,
  DROP COLUMN email,
  DROP COLUMN phone,
  DROP COLUMN location,
  DROP COLUMN business_name,
  DROP COLUMN business_address,
  DROP COLUMN year_established,
  DROP COLUMN naics_code,
  DROP COLUMN ownership_structure,
  DROP COLUMN annual_revenue,
  DROP COLUMN income,
  DROP COLUMN credit_score,
  DROP COLUMN loan_amount,
  DROP COLUMN loan_type,
  DROP COLUMN interest_rate,
  DROP COLUMN maturity_date,
  DROP COLUMN existing_loan_amount,
  DROP COLUMN net_operating_income,
  DROP COLUMN property_payment_amount,
  DROP COLUMN owns_property,
  DROP COLUMN pos_system,
  DROP COLUMN processor_name,
  DROP COLUMN current_processing_rate,
  DROP COLUMN monthly_processing_volume,
  DROP COLUMN average_transaction_size,
  DROP COLUMN bdo_name,
  DROP COLUMN bdo_telephone,
  DROP COLUMN bdo_email,
  DROP COLUMN bank_lender_name,
  DROP COLUMN stage,
  DROP COLUMN priority,
  DROP COLUMN notes,
  DROP COLUMN call_notes;