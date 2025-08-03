import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SecurityWrapperProps {
  children: React.ReactNode;
  requireRole?: string;
  fallback?: React.ReactNode;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ 
  children, 
  requireRole,
  fallback 
}) => {
  const { user, hasRole } = useAuth();
  const { validateSession, trackActivity } = useSessionSecurity();

  useEffect(() => {
    if (user) {
      validateSession();
    }
  }, [user, validateSession]);

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please log in to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  if (requireRole && !hasRole(requireRole)) {
    return fallback || (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this content. Required role: {requireRole}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div onClick={trackActivity} onKeyDown={trackActivity}>
      {children}
    </div>
  );
};