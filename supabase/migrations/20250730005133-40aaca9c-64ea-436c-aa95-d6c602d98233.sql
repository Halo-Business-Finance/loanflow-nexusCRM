-- Create profiles table if it doesn't exist (for proper user references)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Add foreign key constraints for user_id columns to profiles table
ALTER TABLE public.leads 
ADD CONSTRAINT fk_leads_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key for clients.lead_id
ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add foreign keys for pipeline_entries
ALTER TABLE public.pipeline_entries 
ADD CONSTRAINT fk_pipeline_entries_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.pipeline_entries 
ADD CONSTRAINT fk_pipeline_entries_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add foreign keys for loan_requests
ALTER TABLE public.loan_requests 
ADD CONSTRAINT fk_loan_requests_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.loan_requests 
ADD CONSTRAINT fk_loan_requests_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.loan_requests 
ADD CONSTRAINT fk_loan_requests_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add foreign keys for cases
ALTER TABLE public.cases 
ADD CONSTRAINT fk_cases_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.cases 
ADD CONSTRAINT fk_cases_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.cases 
ADD CONSTRAINT fk_cases_escalated_to 
FOREIGN KEY (escalated_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign keys for case_comments
ALTER TABLE public.case_comments 
ADD CONSTRAINT fk_case_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.case_comments 
ADD CONSTRAINT fk_case_comments_case_id 
FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;

-- Add foreign keys for approval workflow
ALTER TABLE public.approval_processes 
ADD CONSTRAINT fk_approval_processes_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.approval_requests 
ADD CONSTRAINT fk_approval_requests_process_id 
FOREIGN KEY (process_id) REFERENCES public.approval_processes(id) ON DELETE CASCADE;

ALTER TABLE public.approval_requests 
ADD CONSTRAINT fk_approval_requests_submitted_by 
FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.approval_steps 
ADD CONSTRAINT fk_approval_steps_request_id 
FOREIGN KEY (request_id) REFERENCES public.approval_requests(id) ON DELETE CASCADE;

ALTER TABLE public.approval_steps 
ADD CONSTRAINT fk_approval_steps_approver_id 
FOREIGN KEY (approver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign keys for custom objects
ALTER TABLE public.custom_objects 
ADD CONSTRAINT fk_custom_objects_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.custom_fields 
ADD CONSTRAINT fk_custom_fields_object_id 
FOREIGN KEY (object_id) REFERENCES public.custom_objects(id) ON DELETE CASCADE;

ALTER TABLE public.custom_fields 
ADD CONSTRAINT fk_custom_fields_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.custom_records 
ADD CONSTRAINT fk_custom_records_object_id 
FOREIGN KEY (object_id) REFERENCES public.custom_objects(id) ON DELETE CASCADE;

ALTER TABLE public.custom_records 
ADD CONSTRAINT fk_custom_records_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign keys for forecasting
ALTER TABLE public.forecast_periods 
ADD CONSTRAINT fk_forecast_periods_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.forecasts 
ADD CONSTRAINT fk_forecasts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.forecasts 
ADD CONSTRAINT fk_forecasts_period_id 
FOREIGN KEY (period_id) REFERENCES public.forecast_periods(id) ON DELETE CASCADE;

-- Add foreign keys for email systems
ALTER TABLE public.email_accounts 
ADD CONSTRAINT fk_email_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.email_campaigns 
ADD CONSTRAINT fk_email_campaigns_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.email_campaign_recipients 
ADD CONSTRAINT fk_email_campaign_recipients_campaign_id 
FOREIGN KEY (campaign_id) REFERENCES public.email_campaigns(id) ON DELETE CASCADE;

ALTER TABLE public.email_campaign_recipients 
ADD CONSTRAINT fk_email_campaign_recipients_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

ALTER TABLE public.email_campaign_recipients 
ADD CONSTRAINT fk_email_campaign_recipients_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add foreign keys for events
ALTER TABLE public.events 
ADD CONSTRAINT fk_events_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.event_attendees 
ADD CONSTRAINT fk_event_attendees_event_id 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_attendees 
ADD CONSTRAINT fk_event_attendees_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

ALTER TABLE public.event_attendees 
ADD CONSTRAINT fk_event_attendees_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add foreign keys for lead scoring
ALTER TABLE public.lead_scoring_models 
ADD CONSTRAINT fk_lead_scoring_models_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.lead_scores 
ADD CONSTRAINT fk_lead_scores_lead_id 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

ALTER TABLE public.lead_scores 
ADD CONSTRAINT fk_lead_scores_scoring_model_id 
FOREIGN KEY (scoring_model_id) REFERENCES public.lead_scoring_models(id) ON DELETE CASCADE;

-- Add foreign keys for knowledge base
ALTER TABLE public.knowledge_articles 
ADD CONSTRAINT fk_knowledge_articles_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.knowledge_articles 
ADD CONSTRAINT fk_knowledge_articles_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign keys for data import jobs
ALTER TABLE public.data_import_jobs 
ADD CONSTRAINT fk_data_import_jobs_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign keys for compliance reports
ALTER TABLE public.compliance_reports 
ADD CONSTRAINT fk_compliance_reports_generated_by 
FOREIGN KEY (generated_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update the handle_new_user function to work with profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Add indexes for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON public.clients(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_entries_lead_id ON public.pipeline_entries(lead_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_client_id ON public.loan_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_lead_id ON public.loan_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_request_id ON public.approval_steps(request_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON public.email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON public.lead_scores(lead_id);