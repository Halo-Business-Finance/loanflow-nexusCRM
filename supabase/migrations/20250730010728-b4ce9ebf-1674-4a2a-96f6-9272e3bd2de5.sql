-- Fix emergency shutdown policies and add missing triggers

-- Add updated_at columns if they don't exist
ALTER TABLE public.emergency_shutdown 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.emergency_events 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add updated_at triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_emergency_shutdown_updated_at'
    ) THEN
        CREATE TRIGGER update_emergency_shutdown_updated_at
            BEFORE UPDATE ON public.emergency_shutdown
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_emergency_events_updated_at'
    ) THEN
        CREATE TRIGGER update_emergency_events_updated_at
            BEFORE UPDATE ON public.emergency_events
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Drop and recreate all policies to use has_role function consistently
DROP POLICY IF EXISTS "Admin users can view emergency shutdown status" ON public.emergency_shutdown;
DROP POLICY IF EXISTS "Admin users can manage emergency shutdown" ON public.emergency_shutdown;
DROP POLICY IF EXISTS "Admin users can view emergency events" ON public.emergency_events;
DROP POLICY IF EXISTS "System can log emergency events" ON public.emergency_events;

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