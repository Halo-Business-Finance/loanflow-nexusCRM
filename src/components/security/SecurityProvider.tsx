import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityContextType {
  isSecurityMonitoring: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  enableSecurityMonitoring: () => void;
  disableSecurityMonitoring: () => void;
  reportSecurityEvent: (eventType: string, severity: string, details?: any) => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { validateSession, trackActivity } = useSessionSecurity();
  const [isSecurityMonitoring, setIsSecurityMonitoring] = useState(true);
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Monitor for security events (disabled aggressive session checking)
  useEffect(() => {
    if (!user || !isSecurityMonitoring) return;

    // Removed the aggressive 30-second session validation that was causing popup spam
    // Session validation is already handled in useSessionSecurity hook every 5 minutes
    // This was causing false positives and user experience issues
    
    return () => {
      // No interval to clear
    };
  }, [user, isSecurityMonitoring]);

  // Monitor for suspicious activities
  useEffect(() => {
    if (!isSecurityMonitoring) return;

    const handleSuspiciousActivity = (event: Event) => {
      // Monitor for rapid clicks, unusual patterns
      const now = Date.now();
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      
      if (now - lastActivity < 100) { // Less than 100ms between actions
        reportSecurityEvent('rapid_user_actions', 'medium', {
          interval: now - lastActivity,
          event_type: event.type
        });
      }
      
      localStorage.setItem('lastActivity', now.toString());
      trackActivity();
    };

    const events = ['click', 'keydown', 'submit'];
    events.forEach(eventType => {
      document.addEventListener(eventType, handleSuspiciousActivity);
    });

    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleSuspiciousActivity);
      });
    };
  }, [isSecurityMonitoring, trackActivity]);

  const enableSecurityMonitoring = () => {
    setIsSecurityMonitoring(true);
    toast.success('Security monitoring enabled');
  };

  const disableSecurityMonitoring = () => {
    setIsSecurityMonitoring(false);
    toast.warning('Security monitoring disabled');
  };

  const reportSecurityEvent = async (eventType: string, severity: string, details?: any) => {
    try {
      await supabase.rpc('log_security_event', {
        p_user_id: user?.id,
        p_event_type: eventType,
        p_severity: severity,
        p_details: details || {}
      });

      // Adjust security level based on event severity
      if (severity === 'critical') {
        setSecurityLevel('critical');
        toast.error('Critical security event detected');
      } else if (severity === 'high') {
        setSecurityLevel('high');
        toast.warning('High priority security event detected');
      }
    } catch (error) {
      console.error('Failed to report security event:', error);
    }
  };

  const value: SecurityContextType = {
    isSecurityMonitoring,
    securityLevel,
    enableSecurityMonitoring,
    disableSecurityMonitoring,
    reportSecurityEvent
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};