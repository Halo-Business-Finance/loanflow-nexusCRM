import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitBranch, 
  TrendingUp, 
  DollarSign, 
  Timer,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InteractivePipeline } from '@/components/InteractivePipeline';

interface PipelineOverview {
  totalOpportunities: number;
  activeDeals: number;
  closedDeals: number;
  totalValue: number;
  avgDealSize: number;
  avgCycleTime: number;
  conversionRate: number;
  stagesCount: Record<string, number>;
}

export default function Pipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [overview, setOverview] = useState<PipelineOverview>({
    totalOpportunities: 0,
    activeDeals: 0,
    closedDeals: 0,
    totalValue: 0,
    avgDealSize: 0,
    avgCycleTime: 0,
    conversionRate: 0,
    stagesCount: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelineOverview();
  }, [user]);

  const fetchPipelineOverview = async () => {
    try {
      setLoading(true);
      
      const { data: pipelineEntries, error: pipelineError } = await supabase
        .from('pipeline_entries')
        .select(`
          *,
          leads(contact_entities(stage))
        `)
        .eq('user_id', user?.id);

      if (!pipelineError && pipelineEntries) {
        const totalOpportunities = pipelineEntries.length;
        const activeDeals = pipelineEntries.filter(entry => 
          entry.stage !== 'Closed Won' && entry.stage !== 'Closed Lost'
        ).length;
        const closedDeals = pipelineEntries.filter(entry => 
          entry.stage === 'Closed Won'
        ).length;
        const totalValue = pipelineEntries.reduce((sum, entry) => 
          sum + (entry.amount || 0), 0
        );
        const avgDealSize = totalOpportunities > 0 ? totalValue / totalOpportunities : 0;
        const conversionRate = totalOpportunities > 0 ? (closedDeals / totalOpportunities) * 100 : 0;

        // Count by stages
        const stagesCount: Record<string, number> = {};
        pipelineEntries.forEach(entry => {
          const stage = entry.stage || 'Unknown';
          stagesCount[stage] = (stagesCount[stage] || 0) + 1;
        });

        setOverview({
          totalOpportunities,
          activeDeals,
          closedDeals,
          totalValue,
          avgDealSize,
          avgCycleTime: 42, // Sample data
          conversionRate,
          stagesCount
        });
      }
    } catch (error) {
      console.error('Error fetching pipeline overview:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pipeline data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Pipeline Management Center</h1>
          <p className="text-muted-foreground ml-4">
            Advanced sales pipeline tracking and opportunity management
          </p>
        </div>

        {/* Pipeline Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Opportunities</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Target className="w-5 h-5" />
                    <p className="text-lg font-bold">{overview.totalOpportunities}</p>
                  </div>
                </div>
                <Badge variant="default">
                  TRACKED
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                  <p className="text-2xl font-bold text-primary">{overview.activeDeals}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(overview.totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Cycle Time</p>
                  <p className="text-2xl font-bold text-primary">{overview.avgCycleTime}d</p>
                </div>
                <Timer className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        {overview.conversionRate < 20 && (
          <Alert className="border-secondary">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Pipeline conversion rate is below target. Consider reviewing qualification criteria.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="visual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visual">Visual Pipeline</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
            <TabsTrigger value="stages">Stage Analysis</TabsTrigger>
            <TabsTrigger value="forecasting">Revenue Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-blue-500" />
                  Interactive Pipeline View
                </CardTitle>
                <CardDescription>
                  Drag and drop opportunities between stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InteractivePipeline />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Conversion Metrics
                  </CardTitle>
                  <CardDescription>
                    Pipeline performance and conversion rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Overall Conversion</span>
                      <span className="font-semibold">{overview.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Deal Size</span>
                      <span className="font-semibold">{formatCurrency(overview.avgDealSize)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <span className="font-semibold text-green-600">68%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Velocity Metrics
                  </CardTitle>
                  <CardDescription>
                    Speed and efficiency of deal progression
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Sales Cycle</span>
                      <span className="font-semibold">{overview.avgCycleTime} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Stage Progression Rate</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Time to Close</span>
                      <span className="font-semibold text-blue-600">32 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Stage Distribution
                </CardTitle>
                <CardDescription>
                  Opportunities breakdown by pipeline stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(overview.stagesCount).map(([stage, count]) => (
                    <div key={stage} className="flex justify-between items-center p-4 border rounded-lg">
                      <span className="text-sm font-medium">{stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-600">{count}</span>
                        <span className="text-sm text-muted-foreground">opportunities</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Revenue Forecast
                  </CardTitle>
                  <CardDescription>
                    Projected revenue based on current pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">This Quarter</span>
                      <span className="font-semibold">{formatCurrency(overview.totalValue * 0.3)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Next Quarter</span>
                      <span className="font-semibold">{formatCurrency(overview.totalValue * 0.5)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Confidence Level</span>
                      <span className="font-semibold text-green-600">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-500" />
                    Target Progress
                  </CardTitle>
                  <CardDescription>
                    Progress towards revenue targets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Target</span>
                      <span className="font-semibold">{formatCurrency(1500000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Progress</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">On Track</span>
                      <span className="font-semibold text-green-600">Yes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}