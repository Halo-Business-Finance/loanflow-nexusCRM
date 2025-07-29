-- Marketing & Communication Tables

-- Email Marketing Campaigns
CREATE TABLE public.email_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL DEFAULT 'drip', -- drip, nurture, broadcast
    status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
    subject_line TEXT,
    email_template TEXT,
    trigger_conditions JSONB, -- conditions for automated campaigns
    send_schedule JSONB, -- scheduling configuration
    target_audience JSONB, -- criteria for audience selection
    performance_metrics JSONB DEFAULT '{}', -- opens, clicks, conversions
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Campaign Recipients
CREATE TABLE public.email_campaign_recipients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    email_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead Scoring System
CREATE TABLE public.lead_scoring_models (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    behavioral_rules JSONB NOT NULL DEFAULT '[]', -- rules for behavioral scoring
    demographic_rules JSONB NOT NULL DEFAULT '[]', -- rules for demographic scoring
    score_thresholds JSONB NOT NULL DEFAULT '{}', -- hot, warm, cold thresholds
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead Scores
CREATE TABLE public.lead_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    scoring_model_id UUID NOT NULL REFERENCES public.lead_scoring_models(id) ON DELETE CASCADE,
    behavioral_score INTEGER NOT NULL DEFAULT 0,
    demographic_score INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    score_category TEXT NOT NULL DEFAULT 'cold', -- hot, warm, cold
    last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    score_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social Media Integration
CREATE TABLE public.social_media_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- linkedin, twitter, facebook
    profile_url TEXT,
    profile_data JSONB DEFAULT '{}', -- platform-specific data
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event Management
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'webinar', -- webinar, conference, meeting, demo
    status TEXT NOT NULL DEFAULT 'planned', -- planned, active, completed, cancelled
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    virtual_link TEXT,
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT true,
    event_data JSONB DEFAULT '{}', -- additional event configuration
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event Attendees
CREATE TABLE public.event_attendees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    registration_status TEXT NOT NULL DEFAULT 'registered', -- registered, confirmed, attended, no_show
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    attendance_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service & Support Tables

-- Case Management
CREATE TABLE public.cases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- assigned agent
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    case_number TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    status TEXT NOT NULL DEFAULT 'new', -- new, open, pending, resolved, closed
    case_type TEXT NOT NULL DEFAULT 'support', -- support, bug, feature_request, complaint
    resolution TEXT,
    resolution_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    escalated_to UUID, -- escalated to which user
    escalation_reason TEXT,
    customer_satisfaction_score INTEGER, -- 1-5 rating
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Case Comments/Updates
CREATE TABLE public.case_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false, -- internal notes vs customer-visible
    comment_type TEXT NOT NULL DEFAULT 'comment', -- comment, status_change, escalation
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge Base
CREATE TABLE public.knowledge_articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- author
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL,
    tags TEXT[],
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
    visibility TEXT NOT NULL DEFAULT 'internal', -- internal, public, client_portal
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community Portals
CREATE TABLE public.communities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    community_type TEXT NOT NULL DEFAULT 'client', -- client, partner, internal
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB DEFAULT '{}', -- portal configuration
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community Members
CREATE TABLE public.community_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID, -- internal users
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE, -- external clients
    role TEXT NOT NULL DEFAULT 'member', -- admin, moderator, member
    status TEXT NOT NULL DEFAULT 'active', -- active, suspended, pending
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enterprise Infrastructure Tables

-- Enhanced Security Configuration
CREATE TABLE public.field_level_security (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    role_restrictions JSONB NOT NULL DEFAULT '{}', -- role-based field access
    user_restrictions JSONB DEFAULT '{}', -- user-specific restrictions
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SSO Configuration
CREATE TABLE public.sso_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name TEXT NOT NULL,
    provider_type TEXT NOT NULL, -- saml, oauth, ldap
    configuration JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    domain_restrictions TEXT[], -- allowed email domains
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced Audit Trail for Compliance
CREATE TABLE public.compliance_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL, -- gdpr, hipaa, sox, custom
    generated_by UUID NOT NULL,
    date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
    filters JSONB DEFAULT '{}',
    report_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'generating', -- generating, completed, failed
    file_path TEXT, -- path to generated report file
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Data Import/Export Tools
CREATE TABLE public.data_import_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL, -- import, export
    data_type TEXT NOT NULL, -- leads, clients, loans, custom_objects
    file_path TEXT,
    file_format TEXT NOT NULL, -- csv, xlsx, json
    mapping_configuration JSONB, -- field mapping config
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_log JSONB DEFAULT '[]',
    progress_percentage DECIMAL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scoring_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_level_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Marketing & Communication

-- Email Campaigns
CREATE POLICY "Users can manage their own email campaigns" ON public.email_campaigns
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view campaign recipients for their campaigns" ON public.email_campaign_recipients
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.email_campaigns 
        WHERE id = campaign_id AND user_id = auth.uid()
    )
);

CREATE POLICY "System can insert campaign recipients" ON public.email_campaign_recipients
FOR INSERT WITH CHECK (true);

-- Lead Scoring
CREATE POLICY "Users can manage their lead scoring models" ON public.lead_scoring_models
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view lead scores for their leads" ON public.lead_scores
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.leads 
        WHERE id = lead_id AND user_id = auth.uid()
    )
);

CREATE POLICY "System can manage lead scores" ON public.lead_scores
FOR ALL WITH CHECK (true);

-- Social Media
CREATE POLICY "Users can view social profiles for their leads/clients" ON public.social_media_profiles
FOR SELECT USING (
    (lead_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.leads WHERE id = lead_id AND user_id = auth.uid()
    )) OR
    (client_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid()
    ))
);

CREATE POLICY "System can manage social profiles" ON public.social_media_profiles
FOR ALL WITH CHECK (true);

-- Events
CREATE POLICY "Users can manage their events" ON public.events
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view attendees for their events" ON public.event_attendees
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE id = event_id AND user_id = auth.uid()
    )
);

CREATE POLICY "System can manage event attendees" ON public.event_attendees
FOR ALL WITH CHECK (true);

-- RLS Policies for Service & Support

-- Cases
CREATE POLICY "Users can view cases assigned to them" ON public.cases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view cases for their clients" ON public.cases
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id = client_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create cases" ON public.cases
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update assigned cases" ON public.cases
FOR UPDATE USING (auth.uid() = user_id);

-- Case Comments
CREATE POLICY "Users can view comments for accessible cases" ON public.case_comments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.cases 
        WHERE id = case_id AND (
            user_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.clients 
                WHERE id = cases.client_id AND user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can create case comments" ON public.case_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Knowledge Articles
CREATE POLICY "Users can view published articles" ON public.knowledge_articles
FOR SELECT USING (
    status = 'published' OR 
    auth.uid() = user_id OR 
    has_role('admin'::user_role)
);

CREATE POLICY "Users can manage their articles" ON public.knowledge_articles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all articles" ON public.knowledge_articles
FOR ALL USING (has_role('admin'::user_role));

-- Communities
CREATE POLICY "Admins can manage communities" ON public.communities
FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view communities they're members of" ON public.communities
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = id AND (
            user_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.clients 
                WHERE id = community_members.client_id AND user_id = auth.uid()
            )
        )
    )
);

-- Community Members
CREATE POLICY "Users can view community members" ON public.community_members
FOR SELECT USING (
    user_id = auth.uid() OR 
    has_role('admin'::user_role) OR
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id = client_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage community members" ON public.community_members
FOR ALL USING (has_role('admin'::user_role));

-- RLS Policies for Enterprise Infrastructure

-- Field Level Security
CREATE POLICY "Admins can manage field security" ON public.field_level_security
FOR ALL USING (has_role('admin'::user_role));

-- SSO Configuration
CREATE POLICY "Admins can manage SSO" ON public.sso_configurations
FOR ALL USING (has_role('admin'::user_role));

-- Compliance Reports
CREATE POLICY "Admins can manage compliance reports" ON public.compliance_reports
FOR ALL USING (has_role('admin'::user_role));

CREATE POLICY "Users can view their generated reports" ON public.compliance_reports
FOR SELECT USING (auth.uid() = generated_by);

-- Data Import/Export
CREATE POLICY "Users can manage their import/export jobs" ON public.data_import_jobs
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_email_campaigns_user_id ON public.email_campaigns(user_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaign_recipients_campaign_id ON public.email_campaign_recipients(campaign_id);
CREATE INDEX idx_email_campaign_recipients_status ON public.email_campaign_recipients(status);

CREATE INDEX idx_lead_scores_lead_id ON public.lead_scores(lead_id);
CREATE INDEX idx_lead_scores_total_score ON public.lead_scores(total_score);
CREATE INDEX idx_lead_scores_category ON public.lead_scores(score_category);

CREATE INDEX idx_cases_user_id ON public.cases(user_id);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_priority ON public.cases(priority);
CREATE INDEX idx_case_comments_case_id ON public.case_comments(case_id);

CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_event_attendees_event_id ON public.event_attendees(event_id);

CREATE INDEX idx_knowledge_articles_status ON public.knowledge_articles(status);
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_visibility ON public.knowledge_articles(visibility);

CREATE INDEX idx_data_import_jobs_user_id ON public.data_import_jobs(user_id);
CREATE INDEX idx_data_import_jobs_status ON public.data_import_jobs(status);

-- Create triggers for updated_at columns
CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON public.email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_scoring_models_updated_at
    BEFORE UPDATE ON public.lead_scoring_models
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_scores_updated_at
    BEFORE UPDATE ON public.lead_scores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON public.knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_level_security_updated_at
    BEFORE UPDATE ON public.field_level_security
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sso_configurations_updated_at
    BEFORE UPDATE ON public.sso_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();