import React from 'react';
import { EnhancedSecurityDashboard } from '@/components/security/EnhancedSecurityDashboard';
import { PersistentAISecurityMonitor } from '@/components/security/PersistentAISecurityMonitor';
import { SecurityWrapper } from '@/components/SecurityWrapper';

const SecurityPage: React.FC = () => {
  return (
    <SecurityWrapper>
      <div className="space-y-6">
        <PersistentAISecurityMonitor />
        <EnhancedSecurityDashboard />
      </div>
    </SecurityWrapper>
  );
};

export default SecurityPage;