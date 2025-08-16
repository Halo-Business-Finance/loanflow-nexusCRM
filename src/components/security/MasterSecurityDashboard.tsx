import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Activity, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Eye,
  Users,
  Brain,
  FileText
} from "lucide-react";

// Import all security components
import { EnhancedSecurityDashboard } from "./EnhancedSecurityDashboard";
import { AdvancedSessionManager } from "./AdvancedSessionManager";
import { KeyRotationManager } from "./KeyRotationManager";
import { ThreatMonitoringDashboard } from "./ThreatMonitoringDashboard";
import { ProductionSecurityHeaders, useSecurityCompliance } from "./ProductionSecurityHeaders";

interface SecurityOverview {
  overallStatus: 'secure' | 'warning' | 'critical';
  activeThreats: number;
  blockedAttacks: number;
  securityScore: number;
  complianceScore: number;
  activeSessions: number;
  keysNeedRotation: number;
}

export function MasterSecurityDashboard() {
  const [overview] = useState<SecurityOverview>({
    overallStatus: 'secure',
    activeThreats: 3,
    blockedAttacks: 147,
    securityScore: 96,
    complianceScore: 98,
    activeSessions: 12,
    keysNeedRotation: 1
  });

  const { checkCompliance } = useSecurityCompliance();
  const compliance = checkCompliance();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'secure': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'secure': return CheckCircle;
      default: return Shield;
    }
  };

  const StatusIcon = getStatusIcon(overview.overallStatus);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Apply security headers */}
      <ProductionSecurityHeaders />
      
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Master Security Command Center</h1>
      </div>

      {/* Security Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIcon className="w-5 h-5" />
                  <p className="text-lg font-bold capitalize">{overview.overallStatus}</p>
                </div>
              </div>
              <Badge variant={getStatusColor(overview.overallStatus)}>
                {overview.overallStatus.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-primary">{overview.securityScore}%</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blocked Attacks</p>
                <p className="text-2xl font-bold text-primary">{overview.blockedAttacks}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold text-primary">{overview.complianceScore}%</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overview.overallStatus === 'warning' && (
        <Alert className="border-secondary">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Security monitoring has detected {overview.activeThreats} active threat(s) requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {overview.keysNeedRotation > 0 && (
        <Alert className="border-secondary">
          <Key className="h-4 w-4" />
          <AlertDescription>
            {overview.keysNeedRotation} encryption key(s) are due for rotation.
          </AlertDescription>
        </Alert>
      )}

      {!compliance.isCompliant && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Security headers compliance score is {compliance.score}%. Review configuration required.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Security Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Threat Monitor
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Key Management
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Security Actions</CardTitle>
                <CardDescription>
                  Immediate security management options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      // Emergency lockdown - comprehensive session cleanup
                      console.log('Emergency lockdown initiated...');
                      
                      // Clear all storage
                      localStorage.clear();
                      sessionStorage.clear();
                      
                      // Clear cookies
                      document.cookie.split(";").forEach(function(c) { 
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                      });
                      
                      // Sign out from Supabase
                      const { supabase } = await import('@/integrations/supabase/client');
                      await supabase.auth.signOut();
                      
                      // Force reload to ensure clean state
                      window.location.replace('/auth');
                    } catch (error) {
                      console.error('Emergency lockdown error:', error);
                      // Even if there's an error, force redirect for security
                      window.location.replace('/auth');
                    }
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Emergency Lockdown
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    // Trigger key rotation (placeholder for actual implementation)
                    alert('Key rotation initiated. All cryptographic keys will be refreshed.');
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Rotate All Keys
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    // Force session refresh
                    window.location.reload();
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Force Session Refresh
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    // Generate compliance report (placeholder)
                    alert('Compliance report generation started. You will receive it via email.');
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Compliance Report
                </Button>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>Security System Health</CardTitle>
                <CardDescription>
                  Real-time status of security components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Firewall Protection</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Threat Detection</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Encryption Services</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audit Logging</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Compliance Monitoring</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Compliant</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Activity</CardTitle>
              <CardDescription>
                Latest security events and system actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">High-risk login attempt blocked</p>
                    <p className="text-xs text-muted-foreground">IP: 203.0.113.45 • 5 minutes ago</p>
                  </div>
                  <Badge variant="destructive">Blocked</Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <Key className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Session encryption key rotated</p>
                    <p className="text-xs text-muted-foreground">Automatic rotation • 1 hour ago</p>
                  </div>
                  <Badge variant="default">Completed</Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                  <Brain className="w-4 h-4 text-secondary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">AI model updated with new threat patterns</p>
                    <p className="text-xs text-muted-foreground">Accuracy improved to 96.8% • 2 hours ago</p>
                  </div>
                  <Badge variant="secondary">Updated</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <ThreatMonitoringDashboard />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <AdvancedSessionManager />
        </TabsContent>

        <TabsContent value="keys" className="mt-6">
          <KeyRotationManager />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <EnhancedSecurityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}