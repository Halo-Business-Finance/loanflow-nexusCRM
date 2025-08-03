-- Phase 1: Critical RLS Policy Hardening - Targeted Fix
-- Fix the most critical overly permissive policies

-- 1. Fix custom_objects table - restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can view custom objects" ON public.custom_objects;
CREATE POLICY "Only admins can view custom objects" 
ON public.custom_objects 
FOR SELECT 
USING (has_role('admin'::user_role));

-- 2. Fix custom_fields table - restrict to admins only  
DROP POLICY IF EXISTS "Authenticated users can view custom fields" ON public.custom_fields;
CREATE POLICY "Only admins can view custom fields" 
ON public.custom_fields 
FOR SELECT 
USING (has_role('admin'::user_role));

-- 3. Fix custom_records table - users can only view records they created
DROP POLICY IF EXISTS "Users can view custom records" ON public.custom_records;
CREATE POLICY "Users can view their own custom records" 
ON public.custom_records 
FOR SELECT 
USING (auth.uid() = created_by OR has_role('admin'::user_role));

-- 4. Fix forecast_periods table - restrict to managers and admins
DROP POLICY IF EXISTS "Users can view forecast periods" ON public.forecast_periods;
CREATE POLICY "Managers and admins can view forecast periods" 
ON public.forecast_periods 
FOR SELECT 
USING (has_role('manager'::user_role) OR has_role('admin'::user_role));

-- 5. Add security headers policies
CREATE POLICY "Only super admins can manage security headers" 
ON public.security_headers 
FOR ALL 
USING (has_role('super_admin'::user_role))
WITH CHECK (has_role('super_admin'::user_role));

CREATE POLICY "System can read active security headers" 
ON public.security_headers 
FOR SELECT 
USING (is_active = true);