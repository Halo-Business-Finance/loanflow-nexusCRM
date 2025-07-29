import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { DataFieldValidator } from "@/lib/data-validator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Database, TrendingUp } from "lucide-react";

interface DataIntegrityDashboardProps {
  onValidationComplete?: (results: any) => void;
}

export function DataIntegrityDashboard({ onValidationComplete }: DataIntegrityDashboardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [auditResults, setAuditResults] = useState<any>(null);
  const [fixingIssues, setFixingIssues] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);

  useEffect(() => {
    performAudit();
  }, []);

  const performAudit = async () => {
    setLoading(true);
    try {
      const results = await DataFieldValidator.performDataAudit();
      setAuditResults(results);
      setLastAuditTime(new Date());
      onValidationComplete?.(results);
      
      if (results.summary.totalIssues === 0) {
        toast({
          title: "Data Integrity Check Complete",
          description: "✅ All data fields are correctly mapped and validated!",
        });
      } else {
        toast({
          title: "Data Issues Found",
          description: `Found ${results.summary.totalIssues} data integrity issues`,
          variant: results.summary.criticalIssues > 0 ? "destructive" : "default",
        });
      }
    } catch (error) {
      console.error('Audit error:', error);
      toast({
        title: "Audit Failed",
        description: "Failed to perform data integrity audit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const autoFixIssues = async () => {
    setFixingIssues(true);
    try {
      const fixResult = await DataFieldValidator.autoFixDataIssues();
      
      if (fixResult.fixed > 0) {
        toast({
          title: "Auto-Fix Complete",
          description: `Fixed ${fixResult.fixed} data integrity issues`,
        });
        
        // Re-run audit to show updated results
        await performAudit();
      } else {
        toast({
          title: "No Issues to Fix",
          description: "All data fields are already properly formatted",
        });
      }
      
      if (fixResult.errors.length > 0) {
        console.error('Auto-fix errors:', fixResult.errors);
        toast({
          title: "Some Issues Remain",
          description: `${fixResult.errors.length} issues could not be automatically fixed`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Auto-fix error:', error);
      toast({
        title: "Auto-Fix Failed",
        description: "Failed to automatically fix data issues",
        variant: "destructive",
      });
    } finally {
      setFixingIssues(false);
    }
  };

  const getStatusIcon = (hasErrors: boolean, hasWarnings: boolean) => {
    if (hasErrors) return <XCircle className="w-5 h-5 text-red-500" />;
    if (hasWarnings) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusColor = (hasErrors: boolean, hasWarnings: boolean) => {
    if (hasErrors) return 'text-red-600';
    if (hasWarnings) return 'text-yellow-600';
    return 'text-green-600';
  };

  const calculateIntegrityScore = () => {
    if (!auditResults) return 0;
    const { totalIssues, criticalIssues } = auditResults.summary;
    if (totalIssues === 0) return 100;
    
    // Calculate score based on severity
    const warningIssues = totalIssues - criticalIssues;
    const penaltyScore = (criticalIssues * 10) + (warningIssues * 3);
    return Math.max(0, 100 - penaltyScore);
  };

  if (loading && !auditResults) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg">Performing data integrity audit...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Integrity Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive field mapping and data validation audit
          </p>
          {lastAuditTime && (
            <p className="text-sm text-muted-foreground mt-1">
              Last audit: {lastAuditTime.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={performAudit}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Re-audit
          </Button>
          <Button
            onClick={autoFixIssues}
            disabled={fixingIssues || !auditResults || auditResults.summary.totalIssues === 0}
          >
            <Database className={`w-4 h-4 mr-2 ${fixingIssues ? 'animate-pulse' : ''}`} />
            Auto-Fix Issues
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {auditResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Data Integrity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {calculateIntegrityScore()}%
                </span>
                <Badge variant={auditResults.summary.criticalIssues > 0 ? "destructive" : 
                               auditResults.summary.totalIssues > 0 ? "default" : "secondary"}>
                  {auditResults.summary.criticalIssues > 0 ? 'Critical Issues' :
                   auditResults.summary.totalIssues > 0 ? 'Minor Issues' : 'Excellent'}
                </Badge>
              </div>
              <Progress value={calculateIntegrityScore()} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">{auditResults.summary.criticalIssues}</div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{auditResults.summary.warningIssues}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.max(0, 100 - auditResults.summary.totalIssues)}
                  </div>
                  <div className="text-sm text-muted-foreground">Valid Records</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {auditResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Leads Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(
                  auditResults.leadIssues.some((i: any) => !i.validation.isValid),
                  auditResults.leadIssues.some((i: any) => i.validation.warnings.length > 0)
                )}
                Leads ({auditResults.leadIssues.length} issues)
              </CardTitle>
              <CardDescription>
                Field mapping validation for leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditResults.leadIssues.length === 0 ? (
                <p className="text-green-600 text-sm">✅ All lead data is properly mapped</p>
              ) : (
                <div className="space-y-2">
                  {auditResults.leadIssues.slice(0, 3).map((issue: any, index: number) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{issue.name}</div>
                      {issue.validation.errors.map((error: string, i: number) => (
                        <div key={i} className="text-red-600 text-xs">• {error}</div>
                      ))}
                      {issue.validation.warnings.map((warning: string, i: number) => (
                        <div key={i} className="text-yellow-600 text-xs">• {warning}</div>
                      ))}
                    </div>
                  ))}
                  {auditResults.leadIssues.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {auditResults.leadIssues.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clients Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(
                  auditResults.clientIssues.some((i: any) => !i.validation.isValid),
                  auditResults.clientIssues.some((i: any) => i.validation.warnings.length > 0)
                )}
                Clients ({auditResults.clientIssues.length} issues)
              </CardTitle>
              <CardDescription>
                Field mapping validation for clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditResults.clientIssues.length === 0 ? (
                <p className="text-green-600 text-sm">✅ All client data is properly mapped</p>
              ) : (
                <div className="space-y-2">
                  {auditResults.clientIssues.slice(0, 3).map((issue: any, index: number) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{issue.name}</div>
                      {issue.validation.errors.map((error: string, i: number) => (
                        <div key={i} className="text-red-600 text-xs">• {error}</div>
                      ))}
                      {issue.validation.warnings.map((warning: string, i: number) => (
                        <div key={i} className="text-yellow-600 text-xs">• {warning}</div>
                      ))}
                    </div>
                  ))}
                  {auditResults.clientIssues.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {auditResults.clientIssues.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(
                  auditResults.pipelineIssues.some((i: any) => !i.validation.isValid),
                  auditResults.pipelineIssues.some((i: any) => i.validation.warnings.length > 0)
                )}
                Pipeline ({auditResults.pipelineIssues.length} issues)
              </CardTitle>
              <CardDescription>
                Field mapping validation for pipeline entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditResults.pipelineIssues.length === 0 ? (
                <p className="text-green-600 text-sm">✅ All pipeline data is properly mapped</p>
              ) : (
                <div className="space-y-2">
                  {auditResults.pipelineIssues.slice(0, 3).map((issue: any, index: number) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">Stage: {issue.stage}</div>
                      {issue.validation.errors.map((error: string, i: number) => (
                        <div key={i} className="text-red-600 text-xs">• {error}</div>
                      ))}
                      {issue.validation.warnings.map((warning: string, i: number) => (
                        <div key={i} className="text-yellow-600 text-xs">• {warning}</div>
                      ))}
                    </div>
                  ))}
                  {auditResults.pipelineIssues.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {auditResults.pipelineIssues.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {auditResults && auditResults.summary.totalIssues > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recommendations:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {auditResults.summary.criticalIssues > 0 && (
                <li>• Fix critical data validation errors immediately</li>
              )}
              {auditResults.summary.warningIssues > 0 && (
                <li>• Review warnings for data consistency issues</li>
              )}
              <li>• Use the Auto-Fix feature to resolve formatting issues</li>
              <li>• Consider updating form validation to prevent future issues</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}