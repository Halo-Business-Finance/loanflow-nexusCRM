-- Advanced Security Enhancements for AI/Hacker Protection

-- 1. Device Fingerprinting for AI Bot Detection
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL,
    device_characteristics JSONB NOT NULL DEFAULT '{}',
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    risk_score INTEGER NOT NULL DEFAULT 0,
    ai_detection_flags JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enhanced Behavioral Analytics
CREATE TABLE IF NOT EXISTS public.user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    action_sequence JSONB NOT NULL DEFAULT '[]',
    timing_patterns JSONB NOT NULL DEFAULT '{}',
    mouse_patterns JSONB DEFAULT '{}',
    keyboard_patterns JSONB DEFAULT '{}',
    ai_likelihood_score INTEGER NOT NULL DEFAULT 0,
    anomaly_flags JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Real-time Threat Detection
CREATE TABLE IF NOT EXISTS public.threat_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    incident_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    threat_vector TEXT NOT NULL,
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    incident_data JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    response_action TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. API Request Monitoring (Anti-Bot)
CREATE TABLE IF NOT EXISTS public.api_request_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_size INTEGER,
    response_time INTEGER,
    status_code INTEGER,
    request_fingerprint TEXT,
    is_bot_suspected BOOLEAN NOT NULL DEFAULT false,
    ai_confidence_score DECIMAL(5,2),
    rate_limit_triggered BOOLEAN NOT NULL DEFAULT false,
    blocked BOOLEAN NOT NULL DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Advanced Session Security
CREATE TABLE IF NOT EXISTS public.secure_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    geo_location JSONB,
    risk_score INTEGER NOT NULL DEFAULT 0,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    requires_mfa BOOLEAN NOT NULL DEFAULT false,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Device Fingerprints
CREATE POLICY "Users can view their own device fingerprints"
ON public.device_fingerprints FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage device fingerprints"
ON public.device_fingerprints FOR ALL
USING (true);

-- RLS Policies for Behavior Patterns
CREATE POLICY "Users can view their own behavior patterns"
ON public.user_behavior_patterns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage behavior patterns"
ON public.user_behavior_patterns FOR ALL
USING (true);

-- RLS Policies for Threat Incidents
CREATE POLICY "Admins can view all threat incidents"
ON public.threat_incidents FOR SELECT
USING (has_role('admin'::user_role));

CREATE POLICY "Users can view their own threat incidents"
ON public.threat_incidents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage threat incidents"
ON public.threat_incidents FOR ALL
USING (true);

-- RLS Policies for API Analytics
CREATE POLICY "Admins can view API analytics"
ON public.api_request_analytics FOR SELECT
USING (has_role('admin'::user_role));

CREATE POLICY "System can manage API analytics"
ON public.api_request_analytics FOR ALL
USING (true);

-- RLS Policies for Secure Sessions
CREATE POLICY "Users can view their own secure sessions"
ON public.secure_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage secure sessions"
ON public.secure_sessions FOR ALL
USING (true);

-- Advanced Security Functions

-- AI Detection Function
CREATE OR REPLACE FUNCTION public.detect_ai_behavior(
    p_user_id UUID,
    p_request_pattern JSONB,
    p_timing_data JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    ai_score INTEGER := 0;
    avg_response_time DECIMAL;
    pattern_variance DECIMAL;
BEGIN
    -- Check for too-perfect timing (AI characteristic)
    IF (p_timing_data->>'variance')::DECIMAL < 10 THEN
        ai_score := ai_score + 30;
    END IF;
    
    -- Check for inhuman speed
    IF (p_timing_data->>'avg_response_ms')::INTEGER < 50 THEN
        ai_score := ai_score + 40;
    END IF;
    
    -- Check for perfect patterns (no human errors)
    IF (p_request_pattern->>'error_rate')::DECIMAL = 0 AND 
       (p_request_pattern->>'request_count')::INTEGER > 10 THEN
        ai_score := ai_score + 25;
    END IF;
    
    -- Check for high-frequency requests
    SELECT COUNT(*) INTO pattern_variance
    FROM public.api_request_analytics 
    WHERE user_id = p_user_id 
    AND created_at > (now() - INTERVAL '1 minute');
    
    IF pattern_variance > 60 THEN -- More than 1 request per second
        ai_score := ai_score + 50;
    END IF;
    
    RETURN LEAST(ai_score, 100);
END;
$$;

-- Enhanced Rate Limiting with AI Detection
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
    p_identifier TEXT,
    p_action_type TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_request_fingerprint TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    rate_result JSONB;
    ai_score INTEGER := 0;
    is_blocked BOOLEAN := false;
BEGIN
    -- Check basic rate limit
    SELECT public.check_rate_limit(p_identifier, p_action_type) INTO rate_result;
    
    -- AI behavior detection
    IF p_user_agent IS NOT NULL THEN
        -- Check for bot-like user agents
        IF p_user_agent ~* '(bot|crawler|spider|scraper|automated)' THEN
            ai_score := ai_score + 60;
        END IF;
        
        -- Check for headless browser indicators
        IF p_user_agent ~* '(headless|phantom|selenium)' THEN
            ai_score := ai_score + 80;
        END IF;
    END IF;
    
    -- Check for request fingerprint patterns
    IF p_request_fingerprint IS NOT NULL THEN
        -- Check for identical repeated fingerprints (bot behavior)
        IF EXISTS (
            SELECT 1 FROM public.api_request_analytics 
            WHERE request_fingerprint = p_request_fingerprint 
            AND created_at > (now() - INTERVAL '1 hour')
            GROUP BY request_fingerprint 
            HAVING COUNT(*) > 50
        ) THEN
            ai_score := ai_score + 70;
        END IF;
    END IF;
    
    -- Block if AI score is too high
    IF ai_score >= 70 THEN
        is_blocked := true;
        
        -- Log threat incident
        INSERT INTO public.threat_incidents (
            incident_type, severity, threat_vector, ai_generated, 
            incident_data, user_agent
        ) VALUES (
            'ai_bot_detection', 'high', 'automated_request', true,
            jsonb_build_object('ai_score', ai_score, 'identifier', p_identifier),
            p_user_agent
        );
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', NOT is_blocked AND (rate_result->>'allowed')::BOOLEAN,
        'ai_score', ai_score,
        'threat_level', CASE 
            WHEN ai_score >= 80 THEN 'critical'
            WHEN ai_score >= 60 THEN 'high'
            WHEN ai_score >= 40 THEN 'medium'
            ELSE 'low'
        END,
        'rate_limit', rate_result
    );
END;
$$;

-- Anomaly Detection Function
CREATE OR REPLACE FUNCTION public.detect_login_anomalies(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_geo_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    anomaly_score INTEGER := 0;
    usual_location TEXT;
    usual_device TEXT;
    recent_attempts INTEGER;
BEGIN
    -- Check for location anomalies
    SELECT DISTINCT (geo_location->>'country') INTO usual_location
    FROM public.secure_sessions 
    WHERE user_id = p_user_id 
    AND created_at > (now() - INTERVAL '30 days')
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF usual_location IS NOT NULL AND usual_location != (p_geo_data->>'country') THEN
        anomaly_score := anomaly_score + 40;
    END IF;
    
    -- Check for device fingerprint anomalies
    SELECT device_fingerprint INTO usual_device
    FROM public.secure_sessions 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Check for rapid multiple attempts (brute force indicator)
    SELECT COUNT(*) INTO recent_attempts
    FROM public.failed_login_attempts 
    WHERE ip_address = p_ip_address 
    AND attempt_time > (now() - INTERVAL '5 minutes');
    
    IF recent_attempts > 3 THEN
        anomaly_score := anomaly_score + 60;
    END IF;
    
    -- Check for time-of-day anomalies
    IF EXTRACT(hour FROM now()) BETWEEN 2 AND 5 THEN -- 2-5 AM suspicious
        anomaly_score := anomaly_score + 20;
    END IF;
    
    RETURN jsonb_build_object(
        'anomaly_score', anomaly_score,
        'requires_additional_verification', anomaly_score >= 50,
        'risk_level', CASE 
            WHEN anomaly_score >= 80 THEN 'critical'
            WHEN anomaly_score >= 60 THEN 'high'
            WHEN anomaly_score >= 40 THEN 'medium'
            ELSE 'low'
        END,
        'factors', jsonb_build_object(
            'location_change', usual_location != (p_geo_data->>'country'),
            'rapid_attempts', recent_attempts > 3,
            'unusual_time', EXTRACT(hour FROM now()) BETWEEN 2 AND 5
        )
    );
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON public.device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_suspicious ON public.device_fingerprints(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_user_session ON public.user_behavior_patterns(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_threat_incidents_severity ON public.threat_incidents(severity) WHERE severity IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_api_analytics_bot_suspected ON public.api_request_analytics(is_bot_suspected) WHERE is_bot_suspected = true;
CREATE INDEX IF NOT EXISTS idx_secure_sessions_risk ON public.secure_sessions(risk_score) WHERE risk_score > 50;