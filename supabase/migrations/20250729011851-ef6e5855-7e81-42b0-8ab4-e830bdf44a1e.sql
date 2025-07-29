-- Fix foreign key constraint to allow proper lead deletion when converted to client
-- The issue is that when a lead is converted to a client, the client table references the lead
-- But when trying to delete the lead, the foreign key constraint prevents it

-- First, let's check the current constraint and drop it
DO $$ 
BEGIN
    -- Drop the existing foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'clients_lead_id_fkey' 
               AND table_name = 'clients') THEN
        ALTER TABLE public.clients DROP CONSTRAINT clients_lead_id_fkey;
    END IF;
END $$;

-- Recreate the foreign key constraint with ON DELETE SET NULL
-- This way, when a lead is deleted, the lead_id in clients table will be set to NULL
-- instead of preventing the deletion
ALTER TABLE public.clients 
ADD CONSTRAINT clients_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE SET NULL;

-- Also, let's create a function to properly handle lead deletion
-- when the lead has been converted to a client
CREATE OR REPLACE FUNCTION public.handle_lead_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- If the lead being deleted has been converted to a client,
    -- update the client record to set lead_id to NULL
    UPDATE public.clients 
    SET lead_id = NULL, 
        updated_at = now()
    WHERE lead_id = OLD.id;
    
    -- Also clean up any pipeline entries that reference this lead
    UPDATE public.pipeline_entries 
    SET lead_id = NULL,
        updated_at = now()
    WHERE lead_id = OLD.id;
    
    -- Log the deletion for audit purposes
    INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id, old_values
    ) VALUES (
        auth.uid(), 
        'lead_deleted', 
        'leads', 
        OLD.id::text,
        to_jsonb(OLD)
    );
    
    RETURN OLD;
END;
$$;

-- Create the trigger to run before lead deletion
DROP TRIGGER IF EXISTS before_lead_delete ON public.leads;
CREATE TRIGGER before_lead_delete
    BEFORE DELETE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_lead_deletion();

-- Update RLS policies to ensure users can delete their own leads
-- even if they've been converted to clients
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads" ON public.leads
FOR DELETE USING (auth.uid() = user_id);

-- Also ensure the client deletion policy allows proper cleanup
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Users can delete their own clients" ON public.clients
FOR DELETE USING (auth.uid() = user_id);