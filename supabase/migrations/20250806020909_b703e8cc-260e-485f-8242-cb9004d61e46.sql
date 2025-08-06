-- EMERGENCY SECURITY FIX: Remove critical data exposure policies
-- These policies allow ANY authenticated user to access ALL leads data

-- Remove the extremely dangerous policies that expose all data
DROP POLICY "All authenticated users can view leads" ON public.leads;
DROP POLICY "All authenticated users can update leads" ON public.leads; 
DROP POLICY "All authenticated users can delete leads" ON public.leads;
DROP POLICY "All authenticated users can create leads" ON public.leads;
DROP POLICY "All users can view all leads" ON public.leads;

-- Create proper user-scoped RLS policies for leads (only if they don't exist)
DO $$
BEGIN
    -- Check if the proper user policies exist, if not create them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' 
        AND policyname = 'Users can view their own leads'
        AND schemaname = 'public'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' 
        AND policyname = 'Users can update their own leads'
        AND schemaname = 'public'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' 
        AND policyname = 'Users can delete their own leads'
        AND schemaname = 'public'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' 
        AND policyname = 'Managers can view team leads'
        AND schemaname = 'public'
    ) THEN
        EXECUTE 'CREATE POLICY "Managers can view team leads" ON public.leads FOR SELECT USING (has_role(''manager''::user_role))';
    END IF;
END $$;