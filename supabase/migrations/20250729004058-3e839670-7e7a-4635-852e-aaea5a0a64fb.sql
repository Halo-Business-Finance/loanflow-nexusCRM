-- Custom Objects & Fields
CREATE TABLE public.custom_objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id UUID NOT NULL REFERENCES public.custom_objects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'picklist', 'textarea', 'email', 'phone', 'url')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  picklist_values JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(object_id, api_name)
);

CREATE TABLE public.custom_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id UUID NOT NULL REFERENCES public.custom_objects(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Builder
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  object_type TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('created', 'updated', 'deleted', 'manual')),
  trigger_conditions JSONB,
  flow_definition JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  execution_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Approval Processes
CREATE TABLE public.approval_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  object_type TEXT NOT NULL,
  entry_criteria JSONB,
  approval_steps JSONB NOT NULL,
  final_approval_actions JSONB,
  final_rejection_actions JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.approval_processes(id),
  record_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'recalled')) DEFAULT 'pending',
  current_step INTEGER NOT NULL DEFAULT 1,
  submitted_by UUID NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT
);

CREATE TABLE public.approval_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  comments TEXT,
  actioned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Territory Management
CREATE TABLE public.territories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.territories(id),
  territory_type TEXT NOT NULL CHECK (territory_type IN ('geographic', 'industry', 'account_size', 'product')),
  rules JSONB NOT NULL,
  manager_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.territory_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'collaborator')),
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(territory_id, user_id)
);

-- Sales Forecasting
CREATE TABLE public.forecast_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('open', 'submitted', 'approved', 'closed')) DEFAULT 'open',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id UUID NOT NULL REFERENCES public.forecast_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  territory_id UUID REFERENCES public.territories(id),
  methodology TEXT NOT NULL CHECK (methodology IN ('best_case', 'most_likely', 'worst_case', 'commit')),
  amount DECIMAL(15,2) NOT NULL,
  quota DECIMAL(15,2),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 0 AND 100),
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(period_id, user_id, methodology)
);

-- Opportunity Splits
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  close_date DATE NOT NULL,
  stage TEXT NOT NULL,
  probability INTEGER CHECK (probability BETWEEN 0 AND 100),
  lead_id UUID REFERENCES public.leads(id),
  client_id UUID REFERENCES public.clients(id),
  territory_id UUID REFERENCES public.territories(id),
  primary_owner_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.opportunity_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  split_type TEXT NOT NULL CHECK (split_type IN ('revenue', 'overlay', 'split_credit')),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  amount DECIMAL(15,2),
  role TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.custom_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Custom Objects
CREATE POLICY "Authenticated users can view custom objects" ON public.custom_objects FOR SELECT USING (true);
CREATE POLICY "Admins can manage custom objects" ON public.custom_objects FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Authenticated users can view custom fields" ON public.custom_fields FOR SELECT USING (true);
CREATE POLICY "Admins can manage custom fields" ON public.custom_fields FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view custom records" ON public.custom_records FOR SELECT USING (true);
CREATE POLICY "Users can create custom records" ON public.custom_records FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their custom records" ON public.custom_records FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all custom records" ON public.custom_records FOR ALL USING (has_role('admin'::user_role));

-- RLS Policies for Workflows
CREATE POLICY "Users can view workflows" ON public.workflows FOR SELECT USING (true);
CREATE POLICY "Admins can manage workflows" ON public.workflows FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view workflow executions" ON public.workflow_executions FOR SELECT USING (true);
CREATE POLICY "System can manage workflow executions" ON public.workflow_executions FOR ALL USING (true);

-- RLS Policies for Approval Processes
CREATE POLICY "Users can view approval processes" ON public.approval_processes FOR SELECT USING (true);
CREATE POLICY "Admins can manage approval processes" ON public.approval_processes FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view relevant approval requests" ON public.approval_requests FOR SELECT USING (
  auth.uid() = submitted_by OR 
  EXISTS (SELECT 1 FROM public.approval_steps WHERE request_id = approval_requests.id AND approver_id = auth.uid()) OR
  has_role('admin'::user_role)
);
CREATE POLICY "Users can create approval requests" ON public.approval_requests FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can update their approval requests" ON public.approval_requests FOR UPDATE USING (auth.uid() = submitted_by);

CREATE POLICY "Users can view relevant approval steps" ON public.approval_steps FOR SELECT USING (
  auth.uid() = approver_id OR 
  EXISTS (SELECT 1 FROM public.approval_requests WHERE id = approval_steps.request_id AND submitted_by = auth.uid()) OR
  has_role('admin'::user_role)
);
CREATE POLICY "Approvers can update their approval steps" ON public.approval_steps FOR UPDATE USING (auth.uid() = approver_id);

-- RLS Policies for Territories
CREATE POLICY "Users can view territories" ON public.territories FOR SELECT USING (true);
CREATE POLICY "Admins can manage territories" ON public.territories FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view territory assignments" ON public.territory_assignments FOR SELECT USING (
  auth.uid() = user_id OR has_role('admin'::user_role) OR has_role('manager'::user_role)
);
CREATE POLICY "Admins can manage territory assignments" ON public.territory_assignments FOR ALL USING (has_role('admin'::user_role));

-- RLS Policies for Forecasting
CREATE POLICY "Users can view forecast periods" ON public.forecast_periods FOR SELECT USING (true);
CREATE POLICY "Admins can manage forecast periods" ON public.forecast_periods FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view relevant forecasts" ON public.forecasts FOR SELECT USING (
  auth.uid() = user_id OR has_role('admin'::user_role) OR has_role('manager'::user_role)
);
CREATE POLICY "Users can manage their forecasts" ON public.forecasts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all forecasts" ON public.forecasts FOR ALL USING (has_role('admin'::user_role));

-- RLS Policies for Opportunities
CREATE POLICY "Users can view opportunities" ON public.opportunities FOR SELECT USING (
  auth.uid() = primary_owner_id OR 
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.opportunity_splits WHERE opportunity_id = opportunities.id AND user_id = auth.uid()) OR
  has_role('admin'::user_role)
);
CREATE POLICY "Users can create opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = primary_owner_id OR auth.uid() = created_by);
CREATE POLICY "Admins can manage all opportunities" ON public.opportunities FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view relevant opportunity splits" ON public.opportunity_splits FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.opportunities WHERE id = opportunity_splits.opportunity_id AND (primary_owner_id = auth.uid() OR created_by = auth.uid())) OR
  has_role('admin'::user_role)
);
CREATE POLICY "Users can create opportunity splits" ON public.opportunity_splits FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their opportunity splits" ON public.opportunity_splits FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all opportunity splits" ON public.opportunity_splits FOR ALL USING (has_role('admin'::user_role));

-- Triggers for updated_at columns
CREATE TRIGGER update_custom_objects_updated_at BEFORE UPDATE ON public.custom_objects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON public.custom_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_records_updated_at BEFORE UPDATE ON public.custom_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_approval_processes_updated_at BEFORE UPDATE ON public.approval_processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_approval_requests_updated_at BEFORE UPDATE ON public.approval_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON public.territories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forecast_periods_updated_at BEFORE UPDATE ON public.forecast_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forecasts_updated_at BEFORE UPDATE ON public.forecasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunity_splits_updated_at BEFORE UPDATE ON public.opportunity_splits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();