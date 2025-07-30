import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  Bot, 
  Globe, 
  Bug, 
  ShieldAlert,
  Activity,
  Lock
} from "lucide-react";

// Import all security components
import { HackerDetectionBot } from './HackerDetectionBot';
import { DarkWebSecurityBot } from './DarkWebSecurityBot';
import { AdvancedThreatDetection } from './AdvancedThreatDetection';
import { EmergencyShutdown } from './EmergencyShutdown';

export function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Security Center</h1>
          <p className="text-muted-foreground">
            Advanced AI-powered threat detection and emergency response system
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <Shield className="h-4 w-4 mr-2" />
          ACTIVE
        </Badge>
      </div>

      {/* Critical Security Alert */}
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          <strong>Zero-Trust Security Model Active:</strong> All AI Security Bots are monitoring for threats and can automatically shutdown the application to prevent data breaches. Emergency shutdown triggers for critical threats including malware, data exfiltration, and privilege escalation attempts.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Shutdown</TabsTrigger>
          <TabsTrigger value="hacker">Hacker Detection</TabsTrigger>
          <TabsTrigger value="darkweb">Dark Web Monitor</TabsTrigger>
          <TabsTrigger value="ai-threats">AI Threats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hacker Detection</CardTitle>
                <Bug className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">ACTIVE</div>
                <p className="text-xs text-muted-foreground">
                  SQL injection, XSS, brute force protection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dark Web Monitor</CardTitle>
                <Globe className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">ACTIVE</div>
                <p className="text-xs text-muted-foreground">
                  Tor networks, credential leaks, marketplace monitoring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Threat Detection</CardTitle>
                <Bot className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">ACTIVE</div>
                <p className="text-xs text-muted-foreground">
                  Behavioral analysis, bot detection, device fingerprinting
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emergency System</CardTitle>
                <Lock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">READY</div>
                <p className="text-xs text-muted-foreground">
                  Auto-shutdown on critical threats detected
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Protection Features
              </CardTitle>
              <CardDescription>
                Comprehensive AI-powered security measures protecting your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-600">✓ Active Protections</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      Real-time SQL injection detection
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      Brute force attack prevention
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      Dark web threat monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      AI/Bot behavior detection
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      Device fingerprinting
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      Vulnerability scan detection
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-red-600">⚡ Emergency Response</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Automatic shutdown on data breach attempts
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Malware injection response
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Privilege escalation blocking
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Critical vulnerability exploit prevention
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Partial/Complete system lockdown
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Auto-restore with admin override
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencyShutdown />
        </TabsContent>

        <TabsContent value="hacker">
          <HackerDetectionBot />
        </TabsContent>

        <TabsContent value="darkweb">
          <DarkWebSecurityBot />
        </TabsContent>

        <TabsContent value="ai-threats">
          <AdvancedThreatDetection />
        </TabsContent>
      </Tabs>
    </div>
  );
}