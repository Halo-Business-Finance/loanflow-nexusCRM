import React from 'react';
import { SessionTimeoutManager } from '@/components/security/SessionTimeoutManager';
import { AdvancedSecurityMonitor } from '@/components/security/AdvancedSecurityMonitor';
import { RealTimeSecurityMonitor } from '@/components/security/RealTimeSecurityMonitor';
import { DataProtectionManager } from '@/components/security/DataProtectionManager';
import { ComplianceManager } from '@/components/security/ComplianceManager';
import { CSPHeaders } from '@/components/security/CSPHeaders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export const EnhancedSecurityDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <CSPHeaders />
      <SessionTimeoutManager />
      
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Security Management</h1>
      </div>

      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="protection" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Data Protection
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <RealTimeSecurityMonitor />
          <AdvancedSecurityMonitor />
        </TabsContent>

        <TabsContent value="protection" className="space-y-6">
          <DataProtectionManager />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceManager />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Real-time Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced security monitoring with real-time threat detection, anomaly analysis, and automated incident response.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade data encryption, secure storage, automated data retention, and GDPR-compliant data handling.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Compliance Reporting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automated compliance reports for GDPR, SOX, and other regulations with comprehensive audit trails.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};