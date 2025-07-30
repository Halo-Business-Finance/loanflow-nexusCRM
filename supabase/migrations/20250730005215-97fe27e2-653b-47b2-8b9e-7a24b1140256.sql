-- Add missing foreign key constraints only

-- Add foreign key for clients.lead_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_clients_lead_id'
  ) THEN
    ALTER TABLE public.clients 
    ADD CONSTRAINT fk_clients_lead_id 
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key for approval_steps.request_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_approval_steps_request_id'
  ) THEN
    ALTER TABLE public.approval_steps
    ADD CONSTRAINT fk_approval_steps_request_id 
    FOREIGN KEY (request_id) REFERENCES public.approval_requests(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for loan_requests.client_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_loan_requests_client_id'
  ) THEN
    ALTER TABLE public.loan_requests
    ADD CONSTRAINT fk_loan_requests_client_id 
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for loan_requests.lead_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_loan_requests_lead_id'
  ) THEN
    ALTER TABLE public.loan_requests
    ADD CONSTRAINT fk_loan_requests_lead_id 
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key for cases.client_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cases_client_id'
  ) THEN
    ALTER TABLE public.cases
    ADD CONSTRAINT fk_cases_client_id 
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for case_comments.case_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_case_comments_case_id'
  ) THEN
    ALTER TABLE public.case_comments
    ADD CONSTRAINT fk_case_comments_case_id 
    FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
  END IF;
END $$;