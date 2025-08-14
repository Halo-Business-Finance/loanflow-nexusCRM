import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, AlertTriangle, X, RefreshCw, Database, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataFieldValidator } from "@/lib/data-validator";
import { DataIntegrityFixer } from "@/lib/data-integrity-fixer";

interface FieldIssue {
  fieldName: string;
  issueType: "missing" | "type_mismatch" | "format_error" | "consistency_error";
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  recordId: string;
  recordType: "lead" | "client" | "pipeline";
}

export function DataIntegrityDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [auditResults, setAuditResults] = useState<any>(null);
  const [fieldIssues, setFieldIssues] = useState<FieldIssue[]>([]);
  const [autoFixResults, setAutoFixResults] = useState<any>(null);

  const runDataAudit = async () => {
    console.log('Run Data Audit button clicked!');
    console.log('Current loading state:', loading);
    setLoading(true);
    try {
      console.log('Creating DataFieldValidator...');
      const validator = new DataFieldValidator();
      console.log('Calling performDataAudit...');
      const results = await validator.performDataAudit();
      console.log('Audit results received:', results);
      setAuditResults(results);
      
      // Convert audit results to field issues format
      const issues: FieldIssue[] = [];
      
      // Process lead issues
      results.leadIssues.forEach((issue: any) => {
        issue.validation.errors.forEach((error: string) => {
          issues.push({
            fieldName: extractFieldName(error),
            issueType: getIssueType(error),
            description: error,
            severity: "high",
            recordId: issue.id,
            recordType: "lead"
          });
        });
        
        issue.validation.warnings.forEach((warning: string) => {
          issues.push({
            fieldName: extractFieldName(warning),
            issueType: getIssueType(warning),
            description: warning,
            severity: "medium",
            recordId: issue.id,
            recordType: "lead"
          });
        });
      });
      
      // Process client issues
      results.clientIssues.forEach((issue: any) => {
        issue.validation.errors.forEach((error: string) => {
          issues.push({
            fieldName: extractFieldName(error),
            issueType: getIssueType(error),
            description: error,
            severity: "high",
            recordId: issue.id,
            recordType: "client"
          });
        });
        
        issue.validation.warnings.forEach((warning: string) => {
          issues.push({
            fieldName: extractFieldName(warning),
            issueType: getIssueType(warning),
            description: warning,
            severity: "medium",
            recordId: issue.id,
            recordType: "client"
          });
        });
      });
      
      // Process pipeline issues
      results.pipelineIssues.forEach((issue: any) => {
        issue.validation.errors.forEach((error: string) => {
          issues.push({
            fieldName: extractFieldName(error),
            issueType: getIssueType(error),
            description: error,
            severity: "high",
            recordId: issue.id,
            recordType: "pipeline"
          });
        });
        
        issue.validation.warnings.forEach((warning: string) => {
          issues.push({
            fieldName: extractFieldName(warning),
            issueType: getIssueType(warning),
            description: warning,
            severity: "medium",
            recordId: issue.id,
            recordType: "pipeline"
          });
        });
      });
      
      setFieldIssues(issues);
      
      toast({
        title: "Data Audit Complete",
        description: `Found ${issues.length} field issues across ${auditResults.summary.totalIssues} records.`
      });
    } catch (error) {
      console.error('Data audit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Audit Failed",
        description: `Failed to complete data audit: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAutoFix = async () => {
    console.log('🔧 Auto-fix button clicked, starting process...');
    setLoading(true);
    try {
      // Use the new DataIntegrityFixer that respects RLS
      const fixer = new DataIntegrityFixer();
      console.log('Created fixer, calling fixCurrentUserContactIssues...');
      const results = await fixer.fixCurrentUserContactIssues();
      console.log('✅ Auto-fix results:', results);
      setAutoFixResults(results);
      
      toast({
        title: "Auto-Fix Complete",
        description: `Fixed ${results.fixed} issues. ${results.errors.length} errors encountered.`,
        variant: results.errors.length > 0 ? "destructive" : "default"
      });
      
      // Re-run audit to show updated results
      await runDataAudit();
    } catch (error) {
      console.error('❌ Auto-fix error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Auto-Fix Failed",
        description: `Failed to auto-fix data issues: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'missing': return <X className="h-4 w-4" />;
      case 'type_mismatch': return <AlertTriangle className="h-4 w-4" />;
      case 'format_error': return <FileText className="h-4 w-4" />;
      case 'consistency_error': return <Database className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Data Integrity Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={() => {
                console.log('Run Data Audit button clicked!');
                console.log('Loading state:', loading);
                runDataAudit();
              }} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Run Data Audit
            </Button>
            
            <Button 
              onClick={() => {
                console.log('Auto-fix button clicked!');
                console.log('Loading state:', loading);
                console.log('Audit results exist:', !!auditResults);
                runAutoFix();
              }} 
              disabled={loading || !auditResults}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Auto-Fix Issues
            </Button>
          </div>

          {auditResults && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <span className="font-medium">Field Issues:</span> {fieldIssues.length}
                  </div>
                  <div>
                    <span className="font-medium">Critical:</span> {auditResults.summary.criticalIssues}
                  </div>
                  <div>
                    <span className="font-medium">Warnings:</span> {auditResults.summary.warningIssues}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {auditResults && (
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues">Field Issues</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="autofix">Auto-Fix Results</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            <div className="space-y-2">
              {fieldIssues.map((issue) => (
                <Card key={`${issue.recordId}-${issue.fieldName}-${issue.issueType}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getIssueTypeIcon(issue.issueType)}
                          <Badge variant={getSeverityColor(issue.severity)}>
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{issue.fieldName}</span>
                          <Badge variant="outline">
                            {issue.recordType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Record ID: {issue.recordId} | Type: {issue.issueType}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {fieldIssues.length === 0 && auditResults && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Field Issues Found</h3>
                    <p className="text-muted-foreground">All data fields are correctly named and consistent.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Lead Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditResults.leadIssues.length}</div>
                  <p className="text-sm text-muted-foreground">Records with issues</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Client Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditResults.clientIssues.length}</div>
                  <p className="text-sm text-muted-foreground">Records with issues</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pipeline Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditResults.pipelineIssues.length}</div>
                  <p className="text-sm text-muted-foreground">Records with issues</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="autofix" className="space-y-4">
            {autoFixResults ? (
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Fix Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Issues Fixed:</span> {autoFixResults.fixed}
                    </div>
                    <div>
                      <span className="font-medium">Errors:</span> {autoFixResults.errors.length}
                    </div>
                  </div>
                  
                  {autoFixResults.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Errors:</h4>
                      {autoFixResults.errors.map((error: string) => (
                        <Alert key={error} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No auto-fix results yet. Run auto-fix to see results.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Helper functions
function extractFieldName(message: string): string {
  const match = message.match(/'([^']+)'/);
  return match ? match[1] : 'unknown_field';
}

function getIssueType(message: string): "missing" | "type_mismatch" | "format_error" | "consistency_error" {
  if (message.includes('missing') || message.includes('required')) return 'missing';
  if (message.includes('should be') || message.includes('type')) return 'type_mismatch';
  if (message.includes('format') || message.includes('invalid')) return 'format_error';
  if (message.includes('consistency') || message.includes('greater than')) return 'consistency_error';
  return 'format_error';
}