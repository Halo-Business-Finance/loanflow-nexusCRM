-- Check if tables exist and create only missing ones

-- Case Management (if not exists)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    case_number TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'new',
    case_type TEXT NOT NULL DEFAULT 'support',
    resolution TEXT,
    resolution_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    escalated_to UUID,
    escalation_reason TEXT,
    customer_satisfaction_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Case Comments
CREATE TABLE IF NOT EXISTS public.case_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    comment_type TEXT NOT NULL DEFAULT 'comment',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge Base
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL,
    tags TEXT[],
    status TEXT NOT NULL DEFAULT 'draft',
    visibility TEXT NOT NULL DEFAULT 'internal',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Communities
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    community_type TEXT NOT NULL DEFAULT 'client',
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community Members
CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead Scoring Models
CREATE TABLE IF NOT EXISTS public.lead_scoring_models (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    behavioral_rules JSONB NOT NULL DEFAULT '[]',
    demographic_rules JSONB NOT NULL DEFAULT '[]',
    score_thresholds JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead Scores
CREATE TABLE IF NOT EXISTS public.lead_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    scoring_model_id UUID NOT NULL REFERENCES public.lead_scoring_models(id) ON DELETE CASCADE,
    behavioral_score INTEGER NOT NULL DEFAULT 0,
    demographic_score INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    score_category TEXT NOT NULL DEFAULT 'cold',
    last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    score_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social Media Profiles
CREATE TABLE IF NOT EXISTS public.social_media_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    profile_url TEXT,
    profile_data JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data Import/Export Jobs
CREATE TABLE IF NOT EXISTS public.data_import_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL,
    data_type TEXT NOT NULL,
    file_path TEXT,
    file_format TEXT NOT NULL,
    mapping_configuration JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
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

-- Compliance Reports
CREATE TABLE IF NOT EXISTS public.compliance_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL,
    generated_by UUID NOT NULL,
    date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
    filters JSONB DEFAULT '{}',
    report_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'generating',
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables (only if they don't already have it)
DO $$ 
BEGIN
    ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.lead_scoring_models ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.social_media_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.data_import_jobs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create RLS policies for new tables

-- Cases
DROP POLICY IF EXISTS "Users can view cases assigned to them" ON public.cases;
CREATE POLICY "Users can view cases assigned to them" ON public.cases
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view cases for their clients" ON public.cases;
CREATE POLICY "Users can view cases for their clients" ON public.cases
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id = client_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create cases" ON public.cases;
CREATE POLICY "Users can create cases" ON public.cases
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update assigned cases" ON public.cases;
CREATE POLICY "Users can update assigned cases" ON public.cases
FOR UPDATE USING (auth.uid() = user_id);

-- Case Comments
DROP POLICY IF EXISTS "Users can view comments for accessible cases" ON public.case_comments;
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

DROP POLICY IF EXISTS "Users can create case comments" ON public.case_comments;
CREATE POLICY "Users can create case comments" ON public.case_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Knowledge Articles
DROP POLICY IF EXISTS "Users can view published articles" ON public.knowledge_articles;
CREATE POLICY "Users can view published articles" ON public.knowledge_articles
FOR SELECT USING (
    status = 'published' OR 
    auth.uid() = user_id OR 
    has_role('admin'::user_role)
);

DROP POLICY IF EXISTS "Users can manage their articles" ON public.knowledge_articles;
CREATE POLICY "Users can manage their articles" ON public.knowledge_articles
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all articles" ON public.knowledge_articles;
CREATE POLICY "Admins can manage all articles" ON public.knowledge_articles
FOR ALL USING (has_role('admin'::user_role));

-- Communities
DROP POLICY IF EXISTS "Admins can manage communities" ON public.communities;
CREATE POLICY "Admins can manage communities" ON public.communities
FOR ALL USING (has_role('admin'::user_role));

-- Community Members
DROP POLICY IF EXISTS "Admins can manage community members" ON public.community_members;
CREATE POLICY "Admins can manage community members" ON public.community_members
FOR ALL USING (has_role('admin'::user_role));

-- Lead Scoring
DROP POLICY IF EXISTS "Users can manage their lead scoring models" ON public.lead_scoring_models;
CREATE POLICY "Users can manage their lead scoring models" ON public.lead_scoring_models
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view lead scores for their leads" ON public.lead_scores;
CREATE POLICY "Users can view lead scores for their leads" ON public.lead_scores
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.leads 
        WHERE id = lead_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "System can manage lead scores" ON public.lead_scores;
CREATE POLICY "System can manage lead scores" ON public.lead_scores
FOR ALL WITH CHECK (true);

-- Social Media
DROP POLICY IF EXISTS "Users can view social profiles for their leads/clients" ON public.social_media_profiles;
CREATE POLICY "Users can view social profiles for their leads/clients" ON public.social_media_profiles
FOR SELECT USING (
    (lead_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.leads WHERE id = lead_id AND user_id = auth.uid()
    )) OR
    (client_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid()
    ))
);

DROP POLICY IF EXISTS "System can manage social profiles" ON public.social_media_profiles;
CREATE POLICY "System can manage social profiles" ON public.social_media_profiles
FOR ALL WITH CHECK (true);

-- Data Import/Export
DROP POLICY IF EXISTS "Users can manage their import/export jobs" ON public.data_import_jobs;
CREATE POLICY "Users can manage their import/export jobs" ON public.data_import_jobs
FOR ALL USING (auth.uid() = user_id);

-- Compliance Reports
DROP POLICY IF EXISTS "Admins can manage compliance reports" ON public.compliance_reports;
CREATE POLICY "Admins can manage compliance reports" ON public.compliance_reports
FOR ALL USING (has_role('admin'::user_role));

DROP POLICY IF EXISTS "Users can view their generated reports" ON public.compliance_reports;
CREATE POLICY "Users can view their generated reports" ON public.compliance_reports
FOR SELECT USING (auth.uid() = generated_by);

-- Create indexes for performance (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    CREATE INDEX idx_cases_user_id ON public.cases(user_id);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX idx_cases_client_id ON public.cases(client_id);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX idx_cases_status ON public.cases(status);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX idx_case_comments_case_id ON public.case_comments(case_id);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX idx_knowledge_articles_status ON public.knowledge_articles(status);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX idx_lead_scores_lead_id ON public.lead_scores(lead_id);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ 
BEGIN
    CREATE INDEX idx_data_import_jobs_user_id ON public.data_import_jobs(user_id);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_cases_updated_at ON public.cases;
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_articles_updated_at ON public.knowledge_articles;
CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON public.knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_communities_updated_at ON public.communities;
CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_scoring_models_updated_at ON public.lead_scoring_models;
CREATE TRIGGER update_lead_scoring_models_updated_at
    BEFORE UPDATE ON public.lead_scoring_models
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_scores_updated_at ON public.lead_scores;
CREATE TRIGGER update_lead_scores_updated_at
    BEFORE UPDATE ON public.lead_scores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();