-- Phase 1: Critical RLS Policy Hardening (Fixed)
-- Fix overly permissive policies on multiple tables

-- 1. Fix blockchain_records table - restrict to admins and system operations
DROP POLICY IF EXISTS "Users can view relevant blockchain records" ON public.blockchain_records;
CREATE POLICY "Users can view blockchain records for their data" 
ON public.blockchain_records 
FOR SELECT 
USING (
  has_role('admin'::user_role) OR 
  (record_type IN ('lead', 'client', 'loan') AND EXISTS (
    SELECT 1 FROM public.audit_logs 
    WHERE user_id = auth.uid() 
    AND record_id = blockchain_records.record_id
  ))
);

-- 2. Fix custom_objects table - restrict to admins only for management
DROP POLICY IF EXISTS "Authenticated users can view custom objects" ON public.custom_objects;
CREATE POLICY "Only admins can view custom objects" 
ON public.custom_objects 
FOR SELECT 
USING (has_role('admin'::user_role));

-- 3. Fix custom_fields table - restrict to admins only for management
DROP POLICY IF EXISTS "Authenticated users can view custom fields" ON public.custom_fields;
CREATE POLICY "Only admins can view custom fields" 
ON public.custom_fields 
FOR SELECT 
USING (has_role('admin'::user_role));

-- 4. Fix custom_records table - users can only view records they created
DROP POLICY IF EXISTS "Users can view custom records" ON public.custom_records;
CREATE POLICY "Users can view their own custom records" 
ON public.custom_records 
FOR SELECT 
USING (auth.uid() = created_by OR has_role('admin'::user_role));

-- 5. Fix approval_processes table - users can only view processes they can participate in
DROP POLICY IF EXISTS "Users can view approval processes" ON public.approval_processes;
CREATE POLICY "Users can view relevant approval processes" 
ON public.approval_processes 
FOR SELECT 
USING (
  has_role('admin'::user_role) OR 
  EXISTS (
    SELECT 1 FROM public.approval_requests ar
    WHERE ar.process_id = approval_processes.id 
    AND ar.submitted_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.approval_steps ast
    WHERE ast.request_id IN (
      SELECT id FROM public.approval_requests 
      WHERE process_id = approval_processes.id
    ) AND ast.approver_id = auth.uid()
  )
);

-- 6. Fix forecast_periods table - restrict to managers and admins
DROP POLICY IF EXISTS "Users can view forecast periods" ON public.forecast_periods;
CREATE POLICY "Managers and admins can view forecast periods" 
ON public.forecast_periods 
FOR SELECT 
USING (has_role('manager'::user_role) OR has_role('admin'::user_role));

-- 7. Add missing policies for security_headers table (currently completely open)
CREATE POLICY "Only super admins can manage security headers" 
ON public.security_headers 
FOR ALL 
USING (has_role('super_admin'::user_role))
WITH CHECK (has_role('super_admin'::user_role));

CREATE POLICY "System can read active security headers" 
ON public.security_headers 
FOR SELECT 
USING (is_active = true);

-- 8. Create enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_security_access_attempt(
  p_table_name text,
  p_action text,
  p_record_id text DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.security_events (
    user_id, event_type, severity, details, ip_address
  ) VALUES (
    auth.uid(),
    'data_access_attempt',
    CASE WHEN p_success THEN 'low' ELSE 'medium' END,
    jsonb_build_object(
      'table_name', p_table_name,
      'action', p_action,
      'record_id', p_record_id,
      'success', p_success,
      'reason', p_reason
    ),
    inet_client_addr()
  );
END;
$function$;

-- 9. Create function to validate user data access
CREATE OR REPLACE FUNCTION public.can_access_user_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT (
    auth.uid() = target_user_id OR 
    has_role('admin'::user_role) OR
    (has_role('manager'::user_role) AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = target_user_id 
      AND role IN ('agent'::user_role)
    ))
  );
$function$;