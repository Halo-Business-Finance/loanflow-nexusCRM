-- Create loan requests table for tracking multiple loan applications per lead
CREATE TABLE public.loan_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Loan details
  loan_amount NUMERIC NOT NULL,
  loan_type TEXT NOT NULL DEFAULT 'SBA 7(a) Loan',
  interest_rate NUMERIC,
  loan_term_months INTEGER,
  purpose TEXT,
  
  -- Request status and tracking
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, under_review, approved, denied, funded
  priority TEXT NOT NULL DEFAULT 'medium', -- high, medium, low
  
  -- Submission details
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  funded_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional information
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for loan requests
CREATE POLICY "Users can view their own loan requests" 
ON public.loan_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create loan requests" 
ON public.loan_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loan requests" 
ON public.loan_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loan requests" 
ON public.loan_requests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_loan_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loan_requests_updated_at
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loan_requests_updated_at();

-- Add constraint to ensure either lead_id or client_id is set (but not both)
ALTER TABLE public.loan_requests 
ADD CONSTRAINT loan_requests_lead_or_client_check 
CHECK (
  (lead_id IS NOT NULL AND client_id IS NULL) OR 
  (lead_id IS NULL AND client_id IS NOT NULL)
);