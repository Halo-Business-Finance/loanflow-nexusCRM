import React from 'react';
import { EnhancedSecurityDashboard } from '@/components/security/EnhancedSecurityDashboard';
import { PersistentAISecurityMonitor } from '@/components/security/PersistentAISecurityMonitor';
import { DarkWebSecurityBot } from '@/components/security/DarkWebSecurityBot';
import { SecurityWrapper } from '@/components/SecurityWrapper';

const SecurityPage: React.FC = () => {
  return (
    <SecurityWrapper>
      <div className="space-y-6">
        {/* HIGH ALERT: Both AI Protection and Dark Web bots running continuously */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PersistentAISecurityMonitor />
          <DarkWebSecurityBot />
        </div>
        <EnhancedSecurityDashboard />
      </div>
    </SecurityWrapper>
  );
};

export default SecurityPage;