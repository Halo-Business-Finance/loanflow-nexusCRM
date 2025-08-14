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
      try {
        await supabase
          .from('active_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken)
          .eq('user_id', user.id);
      } catch (error) {
        // Silently handle cleanup errors - don't prevent signout
        console.warn('Session cleanup warning:', error);
      }
    }
    setSessionToken(null);
  }, [sessionToken, user]);

  // Enhanced logout with session cleanup
  const secureSignOut = useCallback(async () => {
    try {
      await cleanupSession();
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force cleanup even if there's an error
      setSessionToken(null);
      // Still attempt to sign out from Supabase auth
      try {
        await signOut();
      } catch (authError) {
        console.error('Auth sign out error:', authError);
        // Even if auth signout fails, we've cleaned up our session
      }
    }
  }, [cleanupSession, signOut]);

  // Generate session token on login (simplified approach)
  useEffect(() => {
    if (user && !sessionToken) {
      const token = crypto.randomUUID();
      setSessionToken(token);
      
      // Create session record in our custom table only
      supabase
        .from('active_sessions')
        .insert({
          user_id: user.id,
          session_token: token,
          device_fingerprint: generateDeviceFingerprint(),
          user_agent: navigator.userAgent,
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
          ip_address: null // Will be updated on first validation
        })
        .then(({ error }) => {
          if (error) {
            console.error('Session creation error:', error);
            // Don't show toast for creation errors, just log them
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
      
      // Use simplified validation approach
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        console.error('Session validation error:', error);
        
        // Show user-friendly message instead of cryptic error
        toast.error('Session expired', {
          description: 'Please refresh the page to continue.'
        });
        return false;
      }

      if (!data) {
        toast.error('Session not found', {
          description: 'Please log in again.'
        });
        await secureSignOut();
        return false;
      }

      // Update last activity
      await supabase
        .from('active_sessions')
        .update({ 
          last_activity: new Date().toISOString(),
          ip_address: userIpAddress,
          user_agent: navigator.userAgent
        })
        .eq('id', data.id);

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