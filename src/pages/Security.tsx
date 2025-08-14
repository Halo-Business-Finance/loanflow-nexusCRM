import React from 'react';
import { EnhancedSecurityDashboard } from '@/components/security/EnhancedSecurityDashboard';
import { SecurityWrapper } from '@/components/SecurityWrapper';

const SecurityPage: React.FC = () => {
  return (
    <SecurityWrapper>
      <EnhancedSecurityDashboard />
    </SecurityWrapper>
  );
};

export default SecurityPage;