-- Create emergency shutdown system tables (fixed version)

-- Emergency shutdown status table
CREATE TABLE IF NOT EXISTS public.emergency_shutdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reason TEXT NOT NULL,
  shutdown_level TEXT NOT NULL CHECK (shutdown_level IN ('partial', 'complete')),
  triggered_by TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_restore_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Emergency events log table
CREATE TABLE IF NOT EXISTS public.emergency_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  trigger_source TEXT NOT NULL,
  auto_shutdown BOOLEAN NOT NULL DEFAULT false,
  manual_override BOOLEAN NOT NULL DEFAULT false,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for both tables
ALTER TABLE public.emergency_shutdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency_shutdown (admin only) - using existing roles
CREATE POLICY "Admin users can view emergency shutdown status" 
ON public.emergency_shutdown 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "Admin users can manage emergency shutdown" 
ON public.emergency_shutdown 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

-- Create policies for emergency_events (admin only)
CREATE POLICY "Admin users can view emergency events" 
ON public.emergency_events 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "System can log emergency events" 
ON public.emergency_events 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create function to check if system is in emergency shutdown
CREATE OR REPLACE FUNCTION public.is_system_shutdown()
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
      'is_shutdown', true,
      'reason', reason,
      'shutdown_level', shutdown_level,
      'triggered_by', triggered_by,
      'triggered_at', created_at
    )
    FROM public.emergency_shutdown 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 1),
    jsonb_build_object('is_shutdown', false)
  );
$function$;

-- Create function for emergency shutdown trigger
CREATE OR REPLACE FUNCTION public.trigger_emergency_shutdown(
  p_threat_type TEXT,
  p_severity TEXT,
  p_trigger_source TEXT,
  p_threat_data JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  should_shutdown BOOLEAN := false;
BEGIN
  -- Log emergency event
  INSERT INTO public.emergency_events (
    threat_type, severity, trigger_source, auto_shutdown, event_data
  ) VALUES (
    p_threat_type, p_severity, p_trigger_source, false, p_threat_data
  );
  
  -- Check if auto-shutdown should be triggered
  IF p_severity = 'critical' AND p_threat_type IN (
    'multiple_breach_attempts',
    'data_exfiltration_detected', 
    'malware_injection',
    'privilege_escalation',
    'critical_vulnerability_exploit'
  ) THEN
    should_shutdown := true;
    
    -- Trigger partial shutdown
    INSERT INTO public.emergency_shutdown (
      reason, shutdown_level, triggered_by, auto_restore_at
    ) VALUES (
      'Auto-shutdown: ' || p_threat_type || ' detected',
      'partial',
      'AI_Security_Bot',
      now() + INTERVAL '15 minutes'
    );
    
    -- Update event to show auto-shutdown was triggered
    UPDATE public.emergency_events 
    SET auto_shutdown = true 
    WHERE threat_type = p_threat_type 
    AND trigger_source = p_trigger_source
    AND created_at = (
      SELECT MAX(created_at) 
      FROM public.emergency_events 
      WHERE threat_type = p_threat_type 
      AND trigger_source = p_trigger_source
    );
  END IF;
  
  RETURN should_shutdown;
END;
$function$;