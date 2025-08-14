import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

interface SessionValidationResult {
  valid: boolean;
  reason: string;
  requires_reauth: boolean;
}

export const useSessionSecurity = () => {
  const { user, signOut } = useAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Cleanup session on logout
  const cleanupSession = useCallback(async () => {
    if (sessionToken && user) {
      await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken)
        .eq('user_id', user.id);
    }
    setSessionToken(null);
  }, [sessionToken, user]);

  // Enhanced logout with session cleanup
  const secureSignOut = useCallback(async () => {
    await cleanupSession();
    await signOut();
  }, [cleanupSession, signOut]);

  // Generate session token on login (using server-side session management)
  useEffect(() => {
    if (user && !sessionToken) {
      const token = crypto.randomUUID();
      setSessionToken(token);
      
      // Create session record with enhanced security using existing table
       supabase
          .rpc('store_secure_session_token', {
            p_user_id: user.id,
            p_session_token: token,
            p_device_fingerprint: generateDeviceFingerprint(),
            p_user_agent: navigator.userAgent
          })
         .then(({ error }) => {
           if (error) {
             console.error('Secure session creation error:', error);
             // Log security event for failed session creation
             supabase.rpc('log_security_event', {
               p_event_type: 'session_creation_failed',
               p_severity: 'medium',
               p_details: { error: error.message }
             });
           }
         });
    }
  }, [user, sessionToken]);

  // Generate device fingerprint
  const generateDeviceFingerprint = useCallback((): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      canvas: canvas.toDataURL()
    };
    
    return btoa(JSON.stringify(fingerprint));
  }, []);

  // Enhanced session validation with security checks
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || !sessionToken) return false;

    try {
      // Try to get real IP address for security validation (optional)
      let userIpAddress = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const ipData = await response.json();
          userIpAddress = ipData.ip;
        }
      } catch (ipError) {
        // IP lookup failed - continue without it (security graceful degradation)
        console.warn('IP address lookup failed, continuing with session validation:', ipError);
      }
      
      const { data, error } = await supabase.rpc('validate_session_with_security_checks', {
        p_user_id: user.id,
        p_session_token: sessionToken,
        p_ip_address: userIpAddress,
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Session validation error:', error);
        await supabase.rpc('log_enhanced_security_event', {
          p_user_id: user.id,
          p_event_type: 'session_validation_failed',
          p_severity: 'medium',
          p_details: { error: error.message },
          p_ip_address: userIpAddress,
          p_user_agent: navigator.userAgent
        });
        
        // Show user-friendly message instead of cryptic error
        toast.error('Session security check failed', {
          description: 'Please refresh the page if this continues.'
        });
        return false;
      }

      const result = data as unknown as SessionValidationResult & {
        risk_score: number;
        security_flags: string[];
      };
      
      if (!result.valid) {
        toast.error(`Session invalid: ${result.reason}`, {
          description: result.risk_score > 30 ? 'Suspicious activity detected' : undefined
        });
        
        if (result.requires_reauth || result.risk_score > 70) {
          await secureSignOut();
          return false;
        }
        return false;
      }

      // Enhanced monitoring for high-risk sessions
      if (result.risk_score > 30) {
        toast.warning('Security notice: Unusual session activity detected', {
          description: 'Your session is being monitored for security.'
        });
        
        // Log high-risk session activity
        await supabase.rpc('log_enhanced_security_event', {
          p_user_id: user.id,
          p_event_type: 'high_risk_session_activity',
          p_severity: 'high',
          p_details: { 
            risk_score: result.risk_score,
            security_flags: result.security_flags 
          },
          p_ip_address: userIpAddress,
          p_user_agent: navigator.userAgent
        });
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      
      // Only show toast for genuine errors, not network timeouts
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      if (!isNetworkError) {
        toast.error('Session validation failed', {
          description: 'Please try logging in again if this continues.'
        });
      }
      
      if (user) {
        await supabase.rpc('log_enhanced_security_event', {
          p_user_id: user.id,
          p_event_type: 'session_validation_error',
          p_severity: isNetworkError ? 'low' : 'medium',
          p_details: { 
            error: String(error),
            error_type: isNetworkError ? 'network_timeout' : 'validation_error'
          },
          p_user_agent: navigator.userAgent
        });
      }
      return false;
    }
  }, [user, sessionToken, secureSignOut]);

  // Track user activity
  const trackActivity = useCallback(() => {
    setLastActivity(new Date());
  }, []);

  // Set up activity tracking
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [trackActivity]);

  // Periodic session validation
  useEffect(() => {
    if (!user || !sessionToken) return;

    const interval = setInterval(() => {
      validateSession();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [user, sessionToken, validateSession]);

  // Session timeout warning
  useEffect(() => {
    if (!user) return;

    const timeoutWarning = setTimeout(() => {
      toast.warning('Your session will expire soon. Please save your work.', {
        duration: 10000,
        action: {
          label: 'Extend Session',
          onClick: () => trackActivity()
        }
      });
    }, 25 * 60 * 1000); // Warn 5 minutes before 30-minute timeout

    return () => clearTimeout(timeoutWarning);
  }, [lastActivity, user, trackActivity]);


  return {
    validateSession,
    trackActivity,
    lastActivity,
    secureSignOut,
    sessionToken
  };
};