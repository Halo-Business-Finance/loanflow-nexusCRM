import React from 'react';
import { EnhancedSecurityDashboard } from '@/components/security/EnhancedSecurityDashboard';
import { PersistentAISecurityMonitor } from '@/components/security/PersistentAISecurityMonitor';
import { DarkWebSecurityBot } from '@/components/security/DarkWebSecurityBot';
import { AdvancedThreatDetection } from '@/components/security/AdvancedThreatDetection';
import { SecurityWrapper } from '@/components/SecurityWrapper';

const SecurityPage: React.FC = () => {
  return (
    <SecurityWrapper>
      <div className="space-y-6">
        {/* HIGH ALERT: All AI Protection systems running continuously */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PersistentAISecurityMonitor />
          <DarkWebSecurityBot />
        </div>
        
        {/* Real-time AI Threat Monitoring - Always Active */}
        <AdvancedThreatDetection />
        
        <EnhancedSecurityDashboard />
      </div>
    </SecurityWrapper>
  );
};

export default SecurityPage;