-- Create missing enterprise tables

-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    trigger_conditions jsonb DEFAULT '{}',
    workflow_steps jsonb NOT NULL DEFAULT '[]',
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only create RLS and policies if table was just created
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflows') THEN
        ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admins can manage workflows"
        ON public.workflows
        FOR ALL
        USING (public.has_role('admin'::user_role, auth.uid()));
        
        CREATE POLICY "Users can view workflows"
        ON public.workflows
        FOR SELECT
        USING (true);
    END IF;
END $$;

-- Create territories table
CREATE TABLE IF NOT EXISTS public.territories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    geographic_bounds jsonb,
    manager_id uuid,
    team_members uuid[] DEFAULT '{}',
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only create RLS and policies if table was just created
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'territories') THEN
        ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admins can manage territories"
        ON public.territories
        FOR ALL
        USING (public.has_role('admin'::user_role, auth.uid()));
        
        CREATE POLICY "Users can view territories"
        ON public.territories
        FOR SELECT
        USING (true);
    END IF;
END $$;

-- Create opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    amount numeric,
    stage text NOT NULL DEFAULT 'prospecting',
    probability integer DEFAULT 0,
    close_date date,
    account_name text,
    owner_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only create RLS and policies if table was just created
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunities') THEN
        ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their opportunities"
        ON public.opportunities
        FOR SELECT
        USING (auth.uid() = owner_id OR auth.uid() = created_by OR public.has_role('admin'::user_role, auth.uid()));
        
        CREATE POLICY "Users can create opportunities"
        ON public.opportunities
        FOR INSERT
        WITH CHECK (auth.uid() = created_by);
        
        CREATE POLICY "Users can update their opportunities"
        ON public.opportunities
        FOR UPDATE
        USING (auth.uid() = owner_id OR auth.uid() = created_by OR public.has_role('admin'::user_role, auth.uid()));
        
        CREATE POLICY "Admins can delete opportunities"
        ON public.opportunities
        FOR DELETE
        USING (public.has_role('admin'::user_role, auth.uid()));
    END IF;
END $$;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_territories_updated_at ON public.territories;
CREATE TRIGGER update_territories_updated_at
BEFORE UPDATE ON public.territories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();