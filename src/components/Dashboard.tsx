import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  RefreshCw,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Sample data for the dashboard widgets
const performanceData = [
  { name: 'Lead Generation', value: 85 },
  { name: 'Conversion Rate', value: 72 },
  { name: 'Customer Retention', value: 91 },
  { name: 'Revenue Growth', value: 68 },
  { name: 'Market Share', value: 76 }
];

const funnelData = [
  { name: 'Prospects', value: 1000, fill: '#1e40af' },
  { name: 'Qualified Leads', value: 750, fill: '#3b82f6' },
  { name: 'Proposals', value: 500, fill: '#60a5fa' },
  { name: 'Negotiations', value: 250, fill: '#93c5fd' },
  { name: 'Closed Deals', value: 100, fill: '#dbeafe' }
];

const monthlyData = [
  { month: 'Jan', revenue: 45000, deals: 12, target: 50000 },
  { month: 'Feb', revenue: 52000, deals: 15, target: 55000 },
  { month: 'Mar', revenue: 48000, deals: 13, target: 52000 },
  { month: 'Apr', revenue: 67000, deals: 18, target: 60000 },
  { month: 'May', revenue: 71000, deals: 20, target: 70000 },
  { month: 'Jun', revenue: 89000, deals: 24, target: 75000 }
];

const distributionData = [
  { name: 'SBA Loans', value: 45, fill: '#1e40af' },
  { name: 'Commercial', value: 30, fill: '#7c3aed' },
  { name: 'Real Estate', value: 20, fill: '#059669' },
  { name: 'Equipment', value: 5, fill: '#dc2626' }
];

const regionData = [
  { name: 'West Coast', value: 35, fill: '#2563eb' },
  { name: 'East Coast', value: 28, fill: '#7c3aed' },
  { name: 'Midwest', value: 22, fill: '#059669' },
  { name: 'South', value: 15, fill: '#dc2626' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(3600000);
  const [pipelineValue, setPipelineValue] = useState(2100000);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads data for real metrics
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          contact_entities(loan_amount, stage)
        `)
        .eq('user_id', user?.id);

      if (!leadsError && leads) {
        const totalLoanAmount = leads.reduce((sum, lead) => 
          sum + (lead.contact_entities?.loan_amount || 0), 0
        );
        
        if (totalLoanAmount > 0) {
          setTotalRevenue(totalLoanAmount);
          setPipelineValue(totalLoanAmount * 0.6);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      notation: 'compact'
    }).format(amount);
  };

  return (
    <div className="bg-muted/20 min-h-screen">
      {/* Page Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor your business performance and key metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Last 30 days
              </Button>
              <Button variant="outline" size="sm" className="text-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={fetchDashboardData} 
                variant="default" 
                size="sm"
                disabled={loading}
                className="text-sm bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="text-sm">Performance</TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
            <TabsTrigger value="reports" className="text-sm">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +12.5%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-foreground">1,247</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +8.2%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-foreground">{formatCurrency(pipelineValue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          -2.1%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-foreground">24.8%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +5.4%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Performance Metrics Bar Chart */}
              <Card className="bg-card border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Key performance indicators across departments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          width={100}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Performance']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Funnel */}
              <Card className="bg-card border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Target className="h-5 w-5 text-purple-600" />
                    Sales Funnel
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Lead progression through sales stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <FunnelChart>
                        <Tooltip 
                          formatter={(value) => [value, 'Leads']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Funnel
                          dataKey="value"
                          data={funnelData}
                          isAnimationActive
                        >
                          <LabelList position="center" fill="#fff" stroke="none" fontSize={12} />
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Performance */}
              <Card className="bg-card border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Monthly Performance
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Revenue vs targets over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `$${(value / 1000)}k`}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value as number) : 
                            name === 'target' ? formatCurrency(value as number) : value,
                            name === 'revenue' ? 'Revenue' : 
                            name === 'target' ? 'Target' : 'Deals'
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="target" fill="#d1fae5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Loan Type Distribution */}
              <Card className="bg-card border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <PieChart className="h-5 w-5 text-orange-600" />
                    Loan Type Distribution
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Breakdown by loan categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Share']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value}) => `${name}: ${value}%`}
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Regional Distribution */}
              <Card className="bg-card border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Users className="h-5 w-5 text-purple-600" />
                    Regional Performance
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Revenue distribution by region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Share']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Pie
                          data={regionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value}) => `${name}: ${value}%`}
                        >
                          {regionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}