-- Create profiles table if it doesn't exist (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Add foreign key constraints for user_id columns to profiles table
ALTER TABLE public.leads 
ADD CONSTRAINT fk_leads_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add foreign key for pipeline_entries if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_entries') THEN
    ALTER TABLE public.pipeline_entries 
    ADD CONSTRAINT fk_pipeline_entries_lead_id 
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
    
    ALTER TABLE public.pipeline_entries 
    ADD CONSTRAINT fk_pipeline_entries_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix approval_requests and approval_steps relationship
ALTER TABLE public.approval_requests
ADD CONSTRAINT fk_approval_requests_submitted_by 
FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.approval_requests
ADD CONSTRAINT fk_approval_requests_process_id 
FOREIGN KEY (process_id) REFERENCES public.approval_processes(id) ON DELETE CASCADE;

ALTER TABLE public.approval_steps
ADD CONSTRAINT fk_approval_steps_request_id 
FOREIGN KEY (request_id) REFERENCES public.approval_requests(id) ON DELETE CASCADE;

ALTER TABLE public.approval_steps
ADD CONSTRAINT fk_approval_steps_approver_id 
FOREIGN KEY (approver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add other missing foreign key constraints
ALTER TABLE public.loan_requests
ADD CONSTRAINT fk_loan_requests_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.loan_requests
ADD CONSTRAINT fk_loan_requests_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.loan_requests
ADD CONSTRAINT fk_loan_requests_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

ALTER TABLE public.cases
ADD CONSTRAINT fk_cases_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.cases
ADD CONSTRAINT fk_cases_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.case_comments
ADD CONSTRAINT fk_case_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.case_comments
ADD CONSTRAINT fk_case_comments_case_id 
FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;

-- Update the trigger to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  
  -- Create a default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agent'::public.user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();