import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Activity, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  created_at: string;
  auto_resolved: boolean;
}

interface SessionAnomaly {
  id: string;
  anomaly_type: string;
  risk_score: number;
  details: any;
  created_at: string;
  resolved: boolean;
}

export const EnhancedSecurityMonitor: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [anomalies, setAnomalies] = useState<SessionAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
    
    // Set up real-time monitoring
    const alertSubscription = supabase
      .channel('security_alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'security_alerts' },
        (payload) => {
          const newAlert = payload.new as SecurityAlert;
          setAlerts(prev => [newAlert, ...prev]);
          
          if (newAlert.severity === 'high' || newAlert.severity === 'critical') {
            toast({
              title: "Security Alert",
              description: newAlert.title,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    const anomalySubscription = supabase
      .channel('session_anomalies')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_anomalies' },
        (payload) => {
          const newAnomaly = payload.new as SessionAnomaly;
          setAnomalies(prev => [newAnomaly, ...prev]);
          
          if (newAnomaly.risk_score > 70) {
            toast({
              title: "Session Anomaly Detected",
              description: `High-risk activity detected: ${newAnomaly.anomaly_type}`,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertSubscription);
      supabase.removeChannel(anomalySubscription);
    };
  }, [toast]);

  const fetchSecurityData = async () => {
    try {
      const [alertsResponse, anomaliesResponse] = await Promise.all([
        supabase
          .from('security_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('session_anomalies')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (alertsResponse.data) {
        const typedAlerts = alertsResponse.data.map(alert => ({
          ...alert,
          severity: alert.severity as 'low' | 'medium' | 'high' | 'critical'
        }));
        setAlerts(typedAlerts);
      }
      if (anomaliesResponse.data) setAnomalies(anomaliesResponse.data as SessionAnomaly[]);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
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

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'destructive';
    if (riskScore >= 60) return 'destructive';
    if (riskScore >= 40) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Recent Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p>No security alerts detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                  {alert.auto_resolved && (
                    <Badge variant="outline" className="text-green-600">
                      Auto-Resolved
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Anomalies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Session Anomalies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p>No session anomalies detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((anomaly) => (
                <div key={anomaly.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getRiskColor(anomaly.risk_score)}>
                        Risk: {anomaly.risk_score}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(anomaly.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-medium">{anomaly.anomaly_type}</h4>
                    {anomaly.details && (
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(anomaly.details, null, 2)}
                      </p>
                    )}
                  </div>
                  {anomaly.resolved && (
                    <Badge variant="outline" className="text-green-600">
                      Resolved
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};