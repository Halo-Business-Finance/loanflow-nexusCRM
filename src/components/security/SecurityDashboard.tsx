import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Eye, Ban } from 'lucide-react';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  details: any;
  created_at: string;
  user_id?: string;
}

interface SecurityStats {
  total_events: number;
  high_severity_events: number;
  active_sessions: number;
  blocked_ips: number;
}

export const SecurityDashboard: React.FC = () => {
  const { canAccessAdminFeatures } = useRoleBasedAccess();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    total_events: 0,
    high_severity_events: 0,
    active_sessions: 0,
    blocked_ips: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canAccessAdminFeatures) {
      fetchSecurityData();
    }
  }, [canAccessAdminFeatures]);

  const fetchSecurityData = async () => {
    try {
      // Fetch recent security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (events) setSecurityEvents(events);

      // Fetch security statistics
      const { data: eventCount } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true });

      const { data: highSeverityCount } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .in('severity', ['high', 'critical']);

      const { data: activeSessionCount } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        total_events: eventCount?.length || 0,
        high_severity_events: highSeverityCount?.length || 0,
        active_sessions: activeSessionCount?.length || 0,
        blocked_ips: 0 // Would need to implement IP blocking tracking
      });

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (!canAccessAdminFeatures) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access the security dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading security dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage security events and threats</p>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_events}</div>
            <p className="text-xs text-muted-foreground">All security events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.high_severity_events}</div>
            <p className="text-xs text-muted-foreground">Critical & high severity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_sessions}</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blocked_ips}</div>
            <p className="text-xs text-muted-foreground">Banned addresses</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security incidents and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No security events recorded
              </div>
            ) : (
              securityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <div className="font-medium">{event.event_type.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                      {event.details && typeof event.details === 'object' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(event.details).substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(event.severity) as any}>
                    {event.severity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};