import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Eye, 
  Lock,
  Globe,
  Users,
  Database,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedThreatDetection } from './AdvancedThreatDetection';
import { RealTimeSecurityMonitor } from './RealTimeSecurityMonitor';
import { SessionTimeoutManager } from './SessionTimeoutManager';
import { DataProtectionManager } from './DataProtectionManager';
import { ComplianceManager } from './ComplianceManager';
import { CSPHeaders } from './CSPHeaders';

interface SecurityMetrics {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  security_score: number;
  active_sessions: number;
  failed_attempts: number;
  blocked_requests: number;
  policy_violations: number;
  last_incident: string | null;
  uptime_percentage: number;
  encryption_status: 'enabled' | 'partial' | 'disabled';
  backup_status: 'current' | 'outdated' | 'failed';
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  auto_resolved: boolean;
}

export const EnhancedSecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threat_level: 'low',
    security_score: 85,
    active_sessions: 0,
    failed_attempts: 0,
    blocked_requests: 0,
    policy_violations: 0,
    last_incident: null,
    uptime_percentage: 99.9,
    encryption_status: 'enabled',
    backup_status: 'current'
  });
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityMetrics = async () => {
    try {
      // Fetch active sessions
      const { data: sessions, count: sessionCount } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Fetch recent security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch failed login attempts (last 24 hours)
      const { data: failedAttempts, count: failedCount } = await supabase
        .from('failed_login_attempts')
        .select('*', { count: 'exact' })
        .gte('attempt_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate metrics
      const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
      const highEvents = events?.filter(e => e.severity === 'high').length || 0;
      
      let threatLevel: SecurityMetrics['threat_level'] = 'low';
      if (criticalEvents > 0) threatLevel = 'critical';
      else if (highEvents > 3) threatLevel = 'high';
      else if (highEvents > 0 || (failedCount || 0) > 10) threatLevel = 'medium';

      // Calculate security score
      let securityScore = 100;
      securityScore -= (criticalEvents * 20);
      securityScore -= (highEvents * 5);
      securityScore -= Math.min((failedCount || 0) * 2, 30);
      securityScore = Math.max(securityScore, 0);

      setMetrics({
        threat_level: threatLevel,
        security_score: securityScore,
        active_sessions: sessionCount || 0,
        failed_attempts: failedCount || 0,
        blocked_requests: events?.filter(e => e.event_type === 'blocked_request').length || 0,
        policy_violations: events?.filter(e => e.event_type === 'policy_violation').length || 0,
        last_incident: events?.find(e => e.severity === 'critical')?.created_at || null,
        uptime_percentage: 99.9, // This would come from monitoring service
        encryption_status: 'enabled',
        backup_status: 'current'
      });

      // Convert events to alerts format
      const securityAlerts: SecurityAlert[] = events?.slice(0, 10).map(event => ({
        id: event.id,
        type: event.event_type,
        severity: event.severity as SecurityAlert['severity'],
        title: formatEventTitle(event.event_type),
        description: (event.details as any)?.message || `${event.event_type} detected`,
        timestamp: event.created_at,
        acknowledged: false,
        auto_resolved: false
      })) || [];

      setAlerts(securityAlerts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      toast({
        title: "Error Loading Security Dashboard",
        description: "Failed to load security metrics",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const formatEventTitle = (eventType: string): string => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // In a real implementation, this would update the database
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true }
            : alert
        )
      );
      
      toast({
        title: "Alert Acknowledged",
        description: "Security alert has been acknowledged",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Set up real-time subscriptions
    const securityEventsSubscription = supabase
      .channel('security-events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        () => fetchSecurityMetrics()
      )
      .subscribe();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchSecurityMetrics, 30000);

    return () => {
      securityEventsSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSP Headers Component */}
      <CSPHeaders />
      
      {/* Critical Alerts Banner */}
      {alerts.some(alert => alert.severity === 'critical' && !alert.acknowledged) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Critical security alerts require immediate attention! Check the alerts section below.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Threat Level</p>
                <Badge variant={getThreatLevelColor(metrics.threat_level) as any} className="mt-1">
                  {metrics.threat_level.toUpperCase()}
                </Badge>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.security_score)}`}>
                  {metrics.security_score}/100
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{metrics.active_sessions}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Attempts</p>
                <p className="text-2xl font-bold text-red-600">{metrics.failed_attempts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Security Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uptime</span>
              <span className="text-sm text-green-600">{metrics.uptime_percentage}%</span>
            </div>
            <Progress value={metrics.uptime_percentage} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Encryption Status</span>
              <Badge variant={metrics.encryption_status === 'enabled' ? 'default' : 'destructive'}>
                {metrics.encryption_status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Backup Status</span>
              <Badge variant={metrics.backup_status === 'current' ? 'default' : 'secondary'}>
                {metrics.backup_status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Security Events (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Blocked Requests</span>
              <span className="font-semibold">{metrics.blocked_requests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Policy Violations</span>
              <span className="font-semibold">{metrics.policy_violations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Critical Incident</span>
              <span className="text-sm text-muted-foreground">
                {metrics.last_incident 
                  ? new Date(metrics.last_incident).toLocaleDateString()
                  : 'None'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Management Tabs */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="monitoring">
            <Eye className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="threats">
            <Zap className="h-4 w-4 mr-2" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="data">
            <Lock className="h-4 w-4 mr-2" />
            Data Protection
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <CheckCircle className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts ({alerts.filter(a => !a.acknowledged).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <RealTimeSecurityMonitor />
          <SessionTimeoutManager />
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <AdvancedThreatDetection />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataProtectionManager />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceManager />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent security alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${
                        alert.severity === 'critical' 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' 
                          : alert.severity === 'high'
                          ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                          : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getThreatLevelColor(alert.severity) as any}>
                              {alert.severity}
                            </Badge>
                            <span className="font-medium">{alert.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.description}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.acknowledged && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};