-- Fix infinite recursion in RLS policies by using security definer functions

-- Create security definer function to check if user can view approval request
CREATE OR REPLACE FUNCTION public.can_view_approval_request(request_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    -- User submitted the request
    SELECT 1 FROM approval_requests 
    WHERE id = request_id AND submitted_by = user_id
  ) OR EXISTS (
    -- User is an approver for this request
    SELECT 1 FROM approval_steps 
    WHERE request_id = request_id AND approver_id = user_id
  ) OR public.has_role('admin'::user_role, user_id);
$$;

-- Create security definer function to check if user can view approval step
CREATE OR REPLACE FUNCTION public.can_view_approval_step(step_request_id uuid, step_approver_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (user_id = step_approver_id) OR EXISTS (
    -- User submitted the request this step belongs to
    SELECT 1 FROM approval_requests 
    WHERE id = step_request_id AND submitted_by = user_id
  ) OR public.has_role('admin'::user_role, user_id);
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view relevant approval requests" ON approval_requests;
DROP POLICY IF EXISTS "Users can view relevant approval steps" ON approval_steps;

-- Create new policies using security definer functions
CREATE POLICY "Users can view relevant approval requests"
ON approval_requests
FOR SELECT
USING (public.can_view_approval_request(id, auth.uid()));

CREATE POLICY "Users can view relevant approval steps"
ON approval_steps
FOR SELECT
USING (public.can_view_approval_step(request_id, approver_id, auth.uid()));

-- Check if opportunities table exists and create it if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
        CREATE TABLE public.opportunities (
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
        
        -- Enable RLS
        ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
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
        
        -- Add updated_at trigger
        CREATE TRIGGER update_opportunities_updated_at
        BEFORE UPDATE ON public.opportunities
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;