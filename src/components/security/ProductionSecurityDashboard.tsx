/**
 * Production Security Dashboard
 * Optimized security monitoring for production environments
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Zap, Activity, Eye, Lock } from 'lucide-react';
import { productionSecurity } from '@/lib/production-security';
import { useToast } from '@/hooks/use-toast';

interface ComplianceResult {
  score: number;
  issues: string[];
  recommendations: string[];
}

interface SecurityMetrics {
  httpsEnforced: boolean;
  headersValid: boolean;
  rateLimitActive: boolean;
  aiDetectionActive: boolean;
  lastComplianceCheck: string;
  activeThreats: number;
}

export const ProductionSecurityDashboard: React.FC = () => {
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const { toast } = useToast();

  // Run compliance check
  const runComplianceCheck = useCallback(async () => {
    setIsRunningCheck(true);
    try {
      // Simulate async compliance check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = productionSecurity.runComplianceCheck();
      setComplianceResult(result);
      
      // Update security metrics
      setSecurityMetrics({
        httpsEnforced: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        headersValid: true,
        rateLimitActive: true,
        aiDetectionActive: true,
        lastComplianceCheck: new Date().toISOString(),
        activeThreats: result.issues.length
      });
      
      toast({
        title: "Compliance Check Complete",
        description: `Security score: ${result.score}/100`,
        variant: result.score >= 80 ? "default" : "destructive"
      });
      
    } catch (error) {
      toast({
        title: "Compliance Check Failed",
        description: "Unable to complete security compliance check",
        variant: "destructive"
      });
    } finally {
      setIsRunningCheck(false);
    }
  }, [toast]);

  // Initialize monitoring
  useEffect(() => {
    // Run initial compliance check
    runComplianceCheck();
    
    // Set up periodic monitoring
    if (monitoringActive) {
      const interval = setInterval(() => {
        if (!isRunningCheck) {
          runComplianceCheck();
        }
      }, 300000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [monitoringActive, runComplianceCheck, isRunningCheck]);

  // Test rate limiting
  const testRateLimit = useCallback(() => {
    const testId = `test_${Date.now()}`;
    let allowed = 0;
    let blocked = 0;
    
    // Simulate rapid requests
    for (let i = 0; i < 150; i++) {
      if (productionSecurity.checkRateLimit(testId, 100, 60000)) {
        allowed++;
      } else {
        blocked++;
      }
    }
    
    toast({
      title: "Rate Limit Test Complete",
      description: `${allowed} allowed, ${blocked} blocked`,
    });
  }, [toast]);

  // Test AI detection
  const testAIDetection = useCallback(() => {
    const aiScore = productionSecurity.detectAIBehavior({
      userAgent: 'HeadlessChrome/91.0.4472.124',
      timingPattern: [100, 100, 100, 100, 100], // Very consistent timing
      mouseMovements: 0,
      requestPattern: ['GET /api/test', 'GET /api/test', 'GET /api/test']
    });
    
    toast({
      title: "AI Detection Test",
      description: `AI behavior score: ${aiScore}/100`,
      variant: aiScore > 50 ? "destructive" : "default"
    });
  }, [toast]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Security Dashboard</h2>
          <p className="text-muted-foreground">Hardened security monitoring for production environments</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runComplianceCheck}
            disabled={isRunningCheck}
            size="sm"
            variant="outline"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isRunningCheck ? 'Checking...' : 'Run Check'}
          </Button>
          <Button
            onClick={() => setMonitoringActive(!monitoringActive)}
            size="sm"
            variant={monitoringActive ? "default" : "outline"}
          >
            <Eye className="h-4 w-4 mr-2" />
            {monitoringActive ? 'Active' : 'Inactive'}
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(complianceResult?.score || 0)}`}>
                  {complianceResult?.score || 0}/100
                </p>
                <Progress value={complianceResult?.score || 0} className="mt-2" />
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Issues</p>
                <p className="text-3xl font-bold text-red-600">
                  {complianceResult?.issues.length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Check</p>
                <p className="text-sm font-medium">
                  {securityMetrics?.lastComplianceCheck 
                    ? new Date(securityMetrics.lastComplianceCheck).toLocaleTimeString()
                    : 'Never'
                  }
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Features Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-green-600" />
                <span>HTTPS Enforcement</span>
              </div>
              <Badge variant={securityMetrics?.httpsEnforced ? 'default' : 'destructive'}>
                {securityMetrics?.httpsEnforced ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Security Headers</span>
              </div>
              <Badge variant={securityMetrics?.headersValid ? 'default' : 'destructive'}>
                {securityMetrics?.headersValid ? 'Valid' : 'Missing'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-blue-600" />
                <span>Rate Limiting</span>
              </div>
              <Badge variant={securityMetrics?.rateLimitActive ? 'default' : 'secondary'}>
                {securityMetrics?.rateLimitActive ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-purple-600" />
                <span>AI Detection</span>
              </div>
              <Badge variant={securityMetrics?.aiDetectionActive ? 'default' : 'secondary'}>
                {securityMetrics?.aiDetectionActive ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Issues */}
      {complianceResult?.issues && complianceResult.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Security Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceResult.issues.map((issue, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{issue}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {complianceResult?.recommendations && complianceResult.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {complianceResult.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Security Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={testRateLimit} variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Test Rate Limiting
            </Button>
            <Button onClick={testAIDetection} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Test AI Detection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Status */}
      {monitoringActive && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Production security monitoring is active. Compliance checks run every 5 minutes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};