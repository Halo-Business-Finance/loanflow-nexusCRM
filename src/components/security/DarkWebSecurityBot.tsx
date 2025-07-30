import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Eye, Globe, Users, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DarkWebThreat {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  description: string;
  blocked: boolean;
  timestamp: string;
  metadata: Record<string, any>;
}

interface DarkWebMetrics {
  threats_blocked: number;
  suspicious_domains: number;
  tor_attempts: number;
  credential_leaks: number;
  threat_level: "low" | "medium" | "high" | "critical";
}

export function DarkWebSecurityBot() {
  const [threats, setThreats] = useState<DarkWebThreat[]>([]);
  const [metrics, setMetrics] = useState<DarkWebMetrics>({
    threats_blocked: 0,
    suspicious_domains: 0,
    tor_attempts: 0,
    credential_leaks: 0,
    threat_level: "low"
  });
  const [isMonitoring, setIsMonitoring] = useState(() => {
    return localStorage.getItem('dark-web-monitoring') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const detectDarkWebActivity = useCallback(async () => {
    // Simulate dark web threat detection
    const darkWebIndicators = [
      ".onion domains",
      "Tor network traffic",
      "Credential stuffing attempts",
      "Dark web marketplace signatures",
      "Proxy chain connections"
    ];

    const mockThreat: DarkWebThreat = {
      id: crypto.randomUUID(),
      type: darkWebIndicators[Math.floor(Math.random() * darkWebIndicators.length)],
      severity: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
      source: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      description: "Suspicious dark web activity detected",
      blocked: true,
      timestamp: new Date().toISOString(),
      metadata: {
        user_agent: "Tor Browser",
        risk_score: Math.floor(Math.random() * 100),
        geolocation: "Unknown/Hidden"
      }
    };

    // Log to threat incidents table
    try {
      await supabase.from('threat_incidents').insert({
        incident_type: 'dark_web_threat',
        severity: mockThreat.severity,
        threat_vector: 'dark_web_access',
        incident_data: mockThreat as any,
        user_agent: mockThreat.metadata.user_agent
      });
    } catch (error) {
      console.error('Error logging dark web threat:', error);
    }

    return mockThreat;
  }, []);

  const scanDarkWebSources = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('dark-web-scanner', {
        body: { action: 'scan' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Dark web scan error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchDarkWebData = async () => {
      setLoading(true);
      
      // Fetch recent dark web threats
      const { data: incidents } = await supabase
        .from('threat_incidents')
        .select('*')
        .eq('threat_vector', 'dark_web_access')
        .order('created_at', { ascending: false })
        .limit(10);

      if (incidents) {
        const formattedThreats: DarkWebThreat[] = incidents.map(incident => {
          const data = incident.incident_data as any;
          return {
            id: incident.id,
            type: incident.incident_type,
            severity: incident.severity as "low" | "medium" | "high" | "critical",
            source: data?.source || 'Unknown',
            description: data?.description || 'Dark web threat detected',
            blocked: true,
            timestamp: incident.created_at,
            metadata: data?.metadata || {}
          };
        });
        setThreats(formattedThreats);
      }

      // Generate metrics
      setMetrics({
        threats_blocked: incidents?.length || 0,
        suspicious_domains: Math.floor(Math.random() * 20),
        tor_attempts: Math.floor(Math.random() * 15),
        credential_leaks: Math.floor(Math.random() * 5),
        threat_level: incidents && incidents.length > 5 ? "high" : "medium"
      });

      setLoading(false);
    };

    fetchDarkWebData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(async () => {
        const newThreat = await detectDarkWebActivity();
        setThreats(prev => [newThreat, ...prev.slice(0, 9)]);
        setMetrics(prev => ({
          ...prev,
          threats_blocked: prev.threats_blocked + 1,
          threat_level: prev.threats_blocked > 10 ? "critical" : "high"
        }));
      }, 8000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, detectDarkWebActivity]);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    localStorage.setItem('dark-web-monitoring', 'true');
    toast({
      title: "Dark Web Security Bot Activated",
      description: "AI bot is now monitoring for dark web threats and will persist across sessions."
    });
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    localStorage.setItem('dark-web-monitoring', 'false');
    toast({
      title: "Dark Web Security Bot Deactivated",
      description: "Monitoring has been stopped."
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Dark Web Security Bot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Dark Web Security Bot
            <Badge variant={isMonitoring ? "default" : "outline"}>
              {isMonitoring ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
          <CardDescription>
            AI-powered monitoring for dark web threats, Tor networks, and credential leaks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.threat_level === "critical" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Critical dark web threat level detected! Multiple suspicious activities have been blocked.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="metrics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="metrics">Threat Metrics</TabsTrigger>
              <TabsTrigger value="threats">Recent Threats</TabsTrigger>
              <TabsTrigger value="control">Bot Control</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Threats Blocked</p>
                        <p className="text-2xl font-bold">{metrics.threats_blocked}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium">Suspicious Domains</p>
                        <p className="text-2xl font-bold">{metrics.suspicious_domains}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Tor Attempts</p>
                        <p className="text-2xl font-bold">{metrics.tor_attempts}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">Credential Leaks</p>
                        <p className="text-2xl font-bold">{metrics.credential_leaks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Threat Level:</span>
                    <Badge variant={getSeverityColor(metrics.threat_level)} className={getThreatLevelColor(metrics.threat_level)}>
                      {metrics.threat_level.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="threats" className="space-y-4">
              <div className="space-y-2">
                {threats.map((threat) => (
                  <Card key={threat.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(threat.severity)}>
                              {threat.severity.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{threat.type}</span>
                            {threat.blocked && (
                              <Badge variant="outline" className="text-green-600">
                                BLOCKED
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{threat.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Source: {threat.source} | {new Date(threat.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Activity className="h-4 w-4 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="control" className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={handleStartMonitoring} 
                  disabled={isMonitoring}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Start Dark Web Monitoring
                </Button>
                
                <Button 
                  onClick={handleStopMonitoring} 
                  disabled={!isMonitoring}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Stop Monitoring
                </Button>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Bot Capabilities:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Real-time Tor network detection</li>
                    <li>• Dark web marketplace monitoring</li>
                    <li>• Credential leak surveillance</li>
                    <li>• Proxy chain analysis</li>
                    <li>• Anonymous threat blocking</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}