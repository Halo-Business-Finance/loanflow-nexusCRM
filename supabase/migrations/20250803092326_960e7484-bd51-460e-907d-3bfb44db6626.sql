-- Add team member assignment fields to leads table
ALTER TABLE public.leads 
ADD COLUMN loan_originator_id uuid REFERENCES auth.users(id),
ADD COLUMN loan_processor_id uuid REFERENCES auth.users(id),
ADD COLUMN closer_id uuid REFERENCES auth.users(id),
ADD COLUMN funder_id uuid REFERENCES auth.users(id);

-- Add team member assignment fields to contact_entities table to keep them in sync
ALTER TABLE public.contact_entities 
ADD COLUMN loan_originator_id uuid REFERENCES auth.users(id),
ADD COLUMN loan_processor_id uuid REFERENCES auth.users(id),
ADD COLUMN closer_id uuid REFERENCES auth.users(id),
ADD COLUMN funder_id uuid REFERENCES auth.users(id);

-- Create a function to get user display name for team member assignments
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT display_name FROM public.profiles WHERE id = user_uuid),
    (SELECT email FROM auth.users WHERE id = user_uuid),
    'Unknown User'
  );
$$;

-- Create a view for leads with team member names for easier querying
CREATE OR REPLACE VIEW public.leads_with_team_members AS
SELECT 
  l.*,
  public.get_user_display_name(l.loan_originator_id) as loan_originator_name,
  public.get_user_display_name(l.loan_processor_id) as loan_processor_name,
  public.get_user_display_name(l.closer_id) as closer_name,
  public.get_user_display_name(l.funder_id) as funder_name
FROM public.leads l;