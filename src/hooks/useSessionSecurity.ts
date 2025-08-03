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

  // Generate session token on login (using server-side session management)
  useEffect(() => {
    if (user && !sessionToken) {
      const token = crypto.randomUUID();
      setSessionToken(token);
      
      // Create session record with enhanced security
      supabase.rpc('create_secure_session', {
        p_session_token: token,
        p_device_fingerprint: generateDeviceFingerprint(),
        p_user_agent: navigator.userAgent
      }).then(({ error }) => {
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

  // Validate session periodically
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || !sessionToken) return false;

    try {
      const { data, error } = await supabase.rpc('validate_session_with_security_checks', {
        p_user_id: user.id,
        p_session_token: sessionToken,
        p_ip_address: null, // Could be enhanced to get real IP
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Session validation error:', error);
        return false;
      }

      const result = data as unknown as SessionValidationResult;
      
      if (!result.valid) {
        toast.error(`Session invalid: ${result.reason}`);
        if (result.requires_reauth) {
          await signOut();
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, [user, sessionToken, signOut]);

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

  return {
    validateSession,
    trackActivity,
    lastActivity,
    secureSignOut,
    sessionToken
  };
};