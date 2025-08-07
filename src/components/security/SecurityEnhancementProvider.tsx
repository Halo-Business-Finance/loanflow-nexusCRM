import React, { createContext, useContext, useEffect, useState } from 'react';
import { securityMonitoring } from '@/lib/security-monitoring';
import { useAuth } from '@/components/auth/AuthProvider';

interface SecurityContextType {
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  lastSecurityCheck: Date | null;
  performSecurityCheck: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityEnhancement = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityEnhancement must be used within SecurityEnhancementProvider');
  }
  return context;
};

interface SecurityEnhancementProviderProps {
  children: React.ReactNode;
}

export const SecurityEnhancementProvider: React.FC<SecurityEnhancementProviderProps> = ({ children }) => {
  const { user, userRole } = useAuth();
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [lastSecurityCheck, setLastSecurityCheck] = useState<Date | null>(null);

  const performSecurityCheck = async () => {
    if (!user || !userRole) return;

    try {
      // Check for unusual login patterns
      const userAgent = navigator.userAgent;
      const isHeadless = /headless/i.test(userAgent);
      const isSuspiciousAgent = /bot|crawl|spider/i.test(userAgent);
      
      let riskScore = 0;
      const riskFactors: string[] = [];

      if (isHeadless) {
        riskScore += 30;
        riskFactors.push('headless_browser');
      }

      if (isSuspiciousAgent) {
        riskScore += 40;
        riskFactors.push('suspicious_user_agent');
      }

      // Check geo-location if available
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          
          // Log location-based security check
          await securityMonitoring.logSecurityEvent(
            'location_check',
            'low',
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            },
            user.id
          );
        } catch (error) {
          // Geolocation denied or failed - medium risk
          riskScore += 10;
          riskFactors.push('geolocation_denied');
        }
      }

      // Determine security level
      let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore >= 60) level = 'critical';
      else if (riskScore >= 40) level = 'high';
      else if (riskScore >= 20) level = 'medium';

      setSecurityLevel(level);
      setLastSecurityCheck(new Date());

      // Log security assessment
      if (level !== 'low') {
        await securityMonitoring.logSecurityEvent(
          'security_assessment',
          level,
          {
            risk_score: riskScore,
            risk_factors: riskFactors,
            user_role: userRole
          },
          user.id
        );
      }

    } catch (error) {
      console.error('Security check failed:', error);
      setSecurityLevel('medium'); // Default to medium on error
    }
  };

  useEffect(() => {
    if (user) {
      performSecurityCheck();
      
      // Perform security checks every 15 minutes
      const interval = setInterval(performSecurityCheck, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, userRole]);

  const value: SecurityContextType = {
    securityLevel,
    lastSecurityCheck,
    performSecurityCheck
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};