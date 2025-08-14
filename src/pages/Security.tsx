import React from 'react';
import { EnhancedSecurityDashboard } from '@/components/security/EnhancedSecurityDashboard';
import { PersistentAISecurityMonitor } from '@/components/security/PersistentAISecurityMonitor';
import { DarkWebSecurityBot } from '@/components/security/DarkWebSecurityBot';
import { AdvancedThreatDetection } from '@/components/security/AdvancedThreatDetection';
import { ThreatDetectionMonitor } from '@/components/security/ThreatDetectionMonitor';
import { MicrosoftAuthenticatorSetup } from '@/components/auth/MicrosoftAuthenticatorSetup';
import { SecurityWrapper } from '@/components/SecurityWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Bot, Globe, Zap, Target, Smartphone } from 'lucide-react';

const SecurityPage: React.FC = () => {
  return (
    <SecurityWrapper>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">
            Advanced security monitoring, threat detection, and multi-factor authentication
          </p>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitoring">Live Security Monitoring</TabsTrigger>
            <TabsTrigger value="mfa">Microsoft Authenticator MFA</TabsTrigger>
            <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    AI Protection Monitor
                  </CardTitle>
                  <CardDescription>
                    Persistent AI security monitoring with behavioral analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PersistentAISecurityMonitor />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-red-500" />
                    Dark Web Security Bot
                  </CardTitle>
                  <CardDescription>
                    Continuous dark web monitoring and threat detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DarkWebSecurityBot />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Advanced Threat Detection
                  </CardTitle>
                  <CardDescription>
                    Real-time AI threat monitoring and behavioral analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvancedThreatDetection />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Hacker Detection Bot
                  </CardTitle>
                  <CardDescription>
                    Advanced hacker detection and intrusion prevention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThreatDetectionMonitor />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mfa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  Microsoft Authenticator Integration
                </CardTitle>
                <CardDescription>
                  Set up multi-factor authentication using Microsoft Authenticator for enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MicrosoftAuthenticatorSetup />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <EnhancedSecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </SecurityWrapper>
  );
};

export default SecurityPage;