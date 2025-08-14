import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface DashboardOverview {
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  todaysCalls: number;
  emailsSent: number;
  activeUsers: number;
  conversionRate: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview>({
    totalLeads: 0,
    activeLeads: 0,
    convertedLeads: 0,
    totalRevenue: 0,
    todaysCalls: 0,
    emailsSent: 0,
    activeUsers: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          contact_entities(loan_amount, stage)
        `)
        .eq('user_id', user?.id);

      if (!leadsError && leads) {
        const totalLeads = leads.length;
        const activeLeads = leads.filter(lead => 
          lead.contact_entities?.stage && 
          !['Lost', 'Loan Funded'].includes(lead.contact_entities.stage)
        ).length;
        const convertedLeads = leads.filter(lead => 
          lead.contact_entities?.stage === 'Loan Funded'
        ).length;
        const totalRevenue = leads.reduce((sum, lead) => 
          sum + (lead.contact_entities?.loan_amount || 0), 0
        );
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        setOverview(prev => ({
          ...prev,
          totalLeads,
          activeLeads,
          convertedLeads,
          totalRevenue,
          conversionRate
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Command Dashboard</h1>
          <p className="text-muted-foreground ml-4">
            Real-time business intelligence and performance monitoring
          </p>
        </div>

        {/* Dashboard Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-5 h-5" />
                    <p className="text-lg font-bold">{overview.totalLeads}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Active Pipeline</p>
                  <p className="text-2xl font-bold text-primary">{overview.activeLeads}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-primary">{overview.conversionRate.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(overview.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        {overview.conversionRate < 15 && (
          <Alert className="border-secondary">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Conversion rate is below target. Consider reviewing lead qualification process.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="team">Team Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Revenue Performance
                  </CardTitle>
                  <CardDescription>
                    Monthly revenue tracking and forecasting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">This Month</span>
                      <span className="font-semibold">{formatCurrency(overview.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Converted Deals</span>
                      <span className="font-semibold">{overview.convertedLeads}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-semibold text-green-600">{overview.conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Pipeline Health
                  </CardTitle>
                  <CardDescription>
                    Active opportunities and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Opportunities</span>
                      <span className="font-semibold">{overview.activeLeads}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Prospects</span>
                      <span className="font-semibold">{overview.totalLeads}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pipeline Value</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(overview.totalRevenue * 0.3)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-purple-500" />
                    Call Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.todaysCalls}</div>
                  <p className="text-sm text-muted-foreground">Calls today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-orange-500" />
                    Email Outreach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.emailsSent}</div>
                  <p className="text-sm text-muted-foreground">Emails sent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-teal-500" />
                    Business Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.convertedLeads}</div>
                  <p className="text-sm text-muted-foreground">Deals closed</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Team Performance
                </CardTitle>
                <CardDescription>
                  Team metrics and collaboration overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <span className="text-sm font-medium">Active Team Members</span>
                    <span className="font-bold text-indigo-600">{overview.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <span className="text-sm font-medium">Collaboration Score</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}