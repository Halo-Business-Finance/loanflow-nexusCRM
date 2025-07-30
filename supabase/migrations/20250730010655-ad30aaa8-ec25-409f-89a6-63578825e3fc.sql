-- Create emergency shutdown system tables (corrected version)

-- Emergency shutdown status table
CREATE TABLE IF NOT EXISTS public.emergency_shutdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reason TEXT NOT NULL,
  shutdown_level TEXT NOT NULL CHECK (shutdown_level IN ('partial', 'complete')),
  triggered_by TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_restore_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add updated_at triggers
CREATE TRIGGER update_emergency_shutdown_updated_at
    BEFORE UPDATE ON public.emergency_shutdown
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_events_updated_at
    BEFORE UPDATE ON public.emergency_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for both tables
ALTER TABLE public.emergency_shutdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view emergency shutdown status" ON public.emergency_shutdown;
DROP POLICY IF EXISTS "Admin users can manage emergency shutdown" ON public.emergency_shutdown;
DROP POLICY IF EXISTS "Admin users can view emergency events" ON public.emergency_events;

-- Create corrected policies using has_role function
CREATE POLICY "Admin users can view emergency shutdown status" 
ON public.emergency_shutdown 
FOR SELECT 
TO authenticated
USING (has_role('admin'::user_role));

CREATE POLICY "Admin users can manage emergency shutdown" 
ON public.emergency_shutdown 
FOR ALL 
TO authenticated
USING (has_role('admin'::user_role))
WITH CHECK (has_role('admin'::user_role));

CREATE POLICY "Admin users can view emergency events" 
ON public.emergency_events 
FOR SELECT 
TO authenticated
USING (has_role('admin'::user_role));

CREATE POLICY "System can log emergency events" 
ON public.emergency_events 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Update the shutdown trigger function to be more robust
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
  existing_shutdown_id UUID;
BEGIN
  -- Check if system is already in shutdown
  SELECT id INTO existing_shutdown_id
  FROM public.emergency_shutdown 
  WHERE is_active = true 
  LIMIT 1;
  
  -- Log emergency event
  INSERT INTO public.emergency_events (
    threat_type, severity, trigger_source, auto_shutdown, event_data
  ) VALUES (
    p_threat_type, p_severity, p_trigger_source, false, p_threat_data
  );
  
  -- Only trigger shutdown if not already active and severity is critical
  IF existing_shutdown_id IS NULL AND p_severity = 'critical' AND p_threat_type IN (
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
      'AI_Security_Bot_' || p_trigger_source,
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