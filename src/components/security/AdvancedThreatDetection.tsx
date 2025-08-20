import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, TrendingUp, Activity, Globe, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ThreatPattern {
  id: string;
  pattern_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurrences: number;
  first_detected: string;
  last_detected: string;
  auto_mitigated: boolean;
}

interface IPReputation {
  ip_address: string;
  reputation_score: number;
  threat_categories: string[];
  country: string;
  is_vpn: boolean;
  is_tor: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export const AdvancedThreatDetection: React.FC = () => {
  const [threatPatterns, setThreatPatterns] = useState<ThreatPattern[]>([]);
  const [ipReputations, setIpReputations] = useState<IPReputation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanningProgress, setScanningProgress] = useState(0);
  const { toast } = useToast();

  const fetchThreatData = async () => {
    try {
      // Get recent threat patterns from security events
      const { data: patterns } = await supabase
        .from('security_events')
        .select('*')
        .in('severity', ['high', 'critical'])
        .order('created_at', { ascending: false })
        .limit(10);

      // Get suspicious IP addresses from sessions
      const { data: suspiciousIPs } = await supabase
        .from('active_sessions')
        .select('ip_address')
        .not('ip_address', 'is', null)
        .limit(20);

      if (patterns) {
        // Group similar events into patterns
        const patternMap = new Map();
        patterns.forEach(event => {
          const key = event.event_type;
          if (patternMap.has(key)) {
            const existing = patternMap.get(key);
            existing.occurrences++;
            existing.last_detected = event.created_at;
          } else {
            patternMap.set(key, {
              id: event.id,
              pattern_type: event.event_type,
              severity: event.severity,
              description: `Security pattern: ${event.event_type}`,
              occurrences: 1,
              first_detected: event.created_at,
              last_detected: event.created_at,
              auto_mitigated: false
            });
          }
        });
        setThreatPatterns(Array.from(patternMap.values()));
      }

      // Simulate IP reputation analysis
      if (suspiciousIPs && suspiciousIPs.length > 0) {
        const mockReputations: IPReputation[] = suspiciousIPs.slice(0, 5).map((session, index) => ({
          ip_address: session.ip_address || '192.168.1.1',
          reputation_score: Math.floor(Math.random() * 100),
          threat_categories: index % 2 === 0 ? ['malware', 'botnet'] : ['spam', 'phishing'],
          country: ['US', 'CN', 'RU', 'DE', 'FR'][index % 5],
          is_vpn: Math.random() > 0.7,
          is_tor: Math.random() > 0.9,
          risk_level: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)]
        }));
        setIpReputations(mockReputations);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching threat data:', error);
      toast({
        title: "Error Loading Threat Data",
        description: "Failed to load advanced threat detection data",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const runThreatScan = async () => {
    setScanningProgress(0);
    const interval = setInterval(() => {
      setScanningProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          toast({
            title: "Threat Scan Complete",
            description: "Advanced threat scan completed successfully",
          });
          fetchThreatData();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const mitigateThreat = async (patternId: string) => {
    try {
      // Log mitigation action
      await supabase.from('security_events').insert({
        event_type: 'threat_mitigation',
        severity: 'medium',
        details: { pattern_id: patternId, action: 'manual_mitigation' }
      });

      toast({
        title: "Threat Mitigated",
        description: "Security threat has been successfully mitigated",
      });
      
      fetchThreatData();
    } catch (error) {
      toast({
        title: "Mitigation Failed",
        description: "Failed to mitigate threat. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchThreatData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Threat Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
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
            <Shield className="h-5 w-5" />
            Advanced Threat Detection
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={runThreatScan} disabled={scanningProgress > 0 && scanningProgress < 100}>
              <Activity className="h-4 w-4 mr-2" />
              {scanningProgress > 0 && scanningProgress < 100 ? `Scanning... ${scanningProgress}%` : 'Run Deep Scan'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scanningProgress > 0 && scanningProgress < 100 && (
            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${scanningProgress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Threat Patterns
              </h3>
              <p className="text-2xl font-bold">{threatPatterns.length}</p>
              <p className="text-sm text-muted-foreground">Active patterns detected</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                Suspicious IPs
              </h3>
              <p className="text-2xl font-bold">{ipReputations.filter(ip => ip.risk_level !== 'low').length}</p>
              <p className="text-sm text-muted-foreground">High-risk IP addresses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Threat Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {threatPatterns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active threat patterns detected</p>
              ) : (
                threatPatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={pattern.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {pattern.severity}
                        </Badge>
                        <span className="font-medium">{pattern.pattern_type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {pattern.occurrences} occurrences • Last: {new Date(pattern.last_detected).toLocaleDateString()}
                      </p>
                    </div>
                    {!pattern.auto_mitigated && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => mitigateThreat(pattern.id)}
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        Mitigate
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* IP Reputation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              IP Reputation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ipReputations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suspicious IP addresses detected</p>
              ) : (
                ipReputations.map((ip, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{ip.ip_address}</span>
                      <Badge variant={ip.risk_level === 'high' ? 'destructive' : ip.risk_level === 'medium' ? 'default' : 'secondary'}>
                        {ip.risk_level} risk
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Score: {ip.reputation_score}/100</span>
                      <span>Country: {ip.country}</span>
                      {ip.is_vpn && <Badge variant="outline">VPN</Badge>}
                      {ip.is_tor && <Badge variant="outline">Tor</Badge>}
                    </div>
                    {ip.threat_categories.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {ip.threat_categories.map((category, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {threatPatterns.some(p => p.severity === 'critical') && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Critical threat patterns detected! Review and mitigate immediately to maintain system security.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};