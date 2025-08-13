import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Eye, Activity, Lock } from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  created_at: string;
  details: any;
  user_id?: string;
}

interface ThreatMetrics {
  totalEvents: number;
  criticalEvents: number;
  suspiciousActivities: number;
  blockedAttempts: number;
}

export const ThreatMonitoringDashboard: React.FC = () => {
  const { hasRole } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<ThreatMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    suspiciousActivities: 0,
    blockedAttempts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasRole('admin')) return;

    const fetchSecurityData = async () => {
      try {
        // Fetch recent security events
        const { data: events, error: eventsError } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (eventsError) {
          console.error('Error fetching security events:', eventsError);
          return;
        }

        setSecurityEvents(events || []);

        // Calculate metrics
        const totalEvents = events?.length || 0;
        const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
        const suspiciousActivities = events?.filter(e => 
          e.event_type.includes('suspicious') || 
          e.event_type.includes('anomaly')
        ).length || 0;
        const blockedAttempts = events?.filter(e => {
          const details = e.details as any;
          return details?.blocked === true ||
                 e.event_type.includes('blocked') ||
                 e.event_type.includes('denied');
        }).length || 0;

        setMetrics({
          totalEvents,
          criticalEvents,
          suspiciousActivities,
          blockedAttempts
        });

      } catch (error) {
        console.error('Error fetching security data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();

    // Set up real-time subscription for new security events
    const subscription = supabase
      .channel('security_events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          setSecurityEvents(prev => [payload.new as SecurityEvent, ...prev.slice(0, 49)]);
          setMetrics(prev => ({
            ...prev,
            totalEvents: prev.totalEvents + 1,
            criticalEvents: prev.criticalEvents + 
              (payload.new.severity === 'critical' ? 1 : 0)
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [hasRole]);

  if (!hasRole('admin')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Administrator privileges required to view security monitoring.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Security Threat Monitoring</h2>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Last 50 events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <Eye className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.suspiciousActivities}</div>
            <p className="text-xs text-muted-foreground">Potential threats detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Attempts</CardTitle>
            <Lock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.blockedAttempts}</div>
            <p className="text-xs text-muted-foreground">Threats neutralized</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Real-time monitoring of security events and potential threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No security events recorded recently.
              </div>
            ) : (
              securityEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{formatEventType(event.event_type)}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                    
                    {event.details && (
                      <div className="text-sm">
                        {event.details.description || 
                         event.details.activity || 
                         JSON.stringify(event.details, null, 2).slice(0, 100)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};