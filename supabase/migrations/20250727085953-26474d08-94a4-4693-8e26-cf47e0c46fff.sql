-- Create loans table for tracking individual loans
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  loan_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,4), -- e.g., 6.5000 for 6.5%
  loan_term_months INTEGER, -- loan term in months
  maturity_date DATE,
  loan_type TEXT DEFAULT 'Mortgage', -- Mortgage, Personal, Auto, etc.
  status TEXT DEFAULT 'Active', -- Active, Paid Off, Defaulted, etc.
  origination_date DATE DEFAULT CURRENT_DATE,
  monthly_payment DECIMAL(10,2),
  remaining_balance DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Create policies for loans
CREATE POLICY "Users can view their own loans" 
ON public.loans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans" 
ON public.loans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" 
ON public.loans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans" 
ON public.loans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to automatically update client loan totals
CREATE OR REPLACE FUNCTION public.update_client_loan_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update the client's total loans and total value
  UPDATE public.clients 
  SET 
    total_loans = (
      SELECT COUNT(*) 
      FROM public.loans 
      WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
    ),
    total_loan_value = (
      SELECT COALESCE(SUM(loan_amount), 0) 
      FROM public.loans 
      WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers to update client totals when loans change
CREATE TRIGGER update_client_totals_on_insert
AFTER INSERT ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_client_loan_totals();

CREATE TRIGGER update_client_totals_on_update
AFTER UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_client_loan_totals();

CREATE TRIGGER update_client_totals_on_delete
AFTER DELETE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_client_loan_totals();