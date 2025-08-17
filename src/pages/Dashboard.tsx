import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import HorizontalLayout from '@/components/HorizontalLayout';
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
  Building,
  Shield,
  RefreshCw,
  Calendar,
  FileText,
  ChevronRight,
  Eye,
  Search,
  Filter,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  LineChart,
  TrendingDown,
  Award,
  AlertCircle,
  Bell,
  Settings
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardOverview {
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  todaysCalls: number;
  emailsSent: number;
  activeUsers: number;
  conversionRate: number;
  monthlyGrowth: number;
  avgDealSize: number;
  pipelineValue: number;
  tasksCompleted: number;
}

interface RecentActivity {
  id: string;
  type: 'lead' | 'call' | 'email' | 'meeting' | 'deal';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status: 'success' | 'pending' | 'failed';
}

interface PipelineStage {
  name: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
}

interface PerformanceMetric {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

interface TopPerformer {
  id: string;
  name: string;
  role: string;
  deals: number;
  revenue: number;
  avatar?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [overview, setOverview] = useState<DashboardOverview>({
    totalLeads: 0,
    activeLeads: 0,
    convertedLeads: 0,
    totalRevenue: 0,
    todaysCalls: 0,
    emailsSent: 0,
    activeUsers: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
    avgDealSize: 0,
    pipelineValue: 0,
    tasksCompleted: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);

  // Sample data for charts (would be replaced with real data)
  const sampleRevenueData = [
    { month: 'Jan', revenue: 45000, deals: 12 },
    { month: 'Feb', revenue: 52000, deals: 15 },
    { month: 'Mar', revenue: 48000, deals: 13 },
    { month: 'Apr', revenue: 67000, deals: 18 },
    { month: 'May', revenue: 71000, deals: 20 },
    { month: 'Jun', revenue: 89000, deals: 24 }
  ];

  const samplePipelineData: PipelineStage[] = [
    { name: 'Prospecting', count: 45, value: 1250000, percentage: 25, color: '#3b82f6' },
    { name: 'Qualification', count: 32, value: 890000, percentage: 20, color: '#8b5cf6' },
    { name: 'Proposal', count: 18, value: 650000, percentage: 15, color: '#f59e0b' },
    { name: 'Negotiation', count: 12, value: 420000, percentage: 12, color: '#ef4444' },
    { name: 'Closing', count: 8, value: 380000, percentage: 10, color: '#10b981' }
  ];

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
        const avgDealSize = convertedLeads > 0 ? totalRevenue / convertedLeads : 0;

        setOverview(prev => ({
          ...prev,
          totalLeads,
          activeLeads,
          convertedLeads,
          totalRevenue,
          conversionRate,
          avgDealSize,
          pipelineValue: totalRevenue * 1.5, // Estimated pipeline value
          monthlyGrowth: 12.5, // Sample growth rate
          tasksCompleted: 87 // Sample task completion
        }));
      }

      // Set sample data for other components
      setPipelineData(samplePipelineData);
      setRevenueChartData(sampleRevenueData);
      
      // Sample recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'deal',
          title: 'Deal Closed',
          description: 'ABC Corp - $125,000 SBA Loan',
          timestamp: '2 min ago',
          amount: 125000,
          status: 'success'
        },
        {
          id: '2',
          type: 'lead',
          title: 'New Lead',
          description: 'XYZ Manufacturing inquiry',
          timestamp: '15 min ago',
          status: 'pending'
        },
        {
          id: '3',
          type: 'call',
          title: 'Follow-up Call',
          description: 'Scheduled with Tech Solutions Inc',
          timestamp: '1 hour ago',
          status: 'success'
        }
      ]);

      // Sample top performers
      setTopPerformers([
        { id: '1', name: 'Sarah Johnson', role: 'Senior Loan Officer', deals: 24, revenue: 2850000 },
        { id: '2', name: 'Mike Chen', role: 'Loan Specialist', deals: 18, revenue: 2100000 },
        { id: '3', name: 'Emily Rodriguez', role: 'Business Development', deals: 15, revenue: 1750000 }
      ]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const performanceMetrics: PerformanceMetric[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(overview.totalRevenue),
      change: overview.monthlyGrowth,
      trend: overview.monthlyGrowth > 0 ? 'up' : overview.monthlyGrowth < 0 ? 'down' : 'neutral',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Leads',
      value: overview.activeLeads.toString(),
      change: 8.2,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Conversion Rate',
      value: `${overview.conversionRate.toFixed(1)}%`,
      change: 2.1,
      trend: 'up',
      icon: Target,
      color: 'text-purple-600'
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(overview.avgDealSize),
      change: -3.8,
      trend: 'down',
      icon: Award,
      color: 'text-orange-600'
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'deal':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'lead':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'call':
        return <Phone className="h-4 w-4 text-purple-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-orange-600" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-indigo-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <HorizontalLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </HorizontalLayout>
    );
  }

  return (
    <HorizontalLayout>
      <div className="bg-background">
        {/* Page Header */}
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Home</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome back! Here's your business overview.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={fetchDashboardData} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-background min-h-screen">
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {performanceMetrics.map((metric, index) => (
              <Card key={index} className="bg-card border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{metric.title}</p>
                      <div className="flex items-center gap-2">
                        <metric.icon className={`h-4 w-4 ${metric.color}`} />
                        <span className="text-xl font-semibold text-foreground">{metric.value}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend)}
                        <span className={`text-xs font-medium ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {Math.abs(metric.change)}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Alerts */}
          {(overview.conversionRate < 15 || overview.activeLeads > 100) && (
            <div className="grid gap-3 mb-6">
              {overview.conversionRate < 15 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 text-sm">
                    <strong>Low Conversion Rate:</strong> Current rate is {overview.conversionRate.toFixed(1)}%. 
                    Consider reviewing lead qualification process.
                  </AlertDescription>
                </Alert>
              )}
              
              {overview.activeLeads > 100 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>High Lead Volume:</strong> You have {overview.activeLeads} active leads. 
                    Consider lead prioritization.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2 bg-card border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Revenue Performance
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Monthly revenue and deal closure trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={(value) => `$${(value / 1000)}k`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(value as number) : value,
                          name === 'revenue' ? 'Revenue' : 'Deals'
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#0ea5e9" 
                        fill="url(#revenueGradient)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Overview */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <PieChart className="h-4 w-4 text-blue-600" />
                  Sales Pipeline
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Current pipeline distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pipelineData.map((stage, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{stage.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{stage.count}</span>
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(stage.value)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Total Pipeline</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(pipelineData.reduce((sum, stage) => sum + stage.value, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-foreground">Recent Activity</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/activities')} className="text-xs">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-foreground">{activity.title}</p>
                        <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      {activity.amount && (
                        <span className="text-xs font-medium text-green-600">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-foreground">Top Performers</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/users')} className="text-xs">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {performer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Star className="h-1.5 w-1.5 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{performer.name}</p>
                      <p className="text-xs text-muted-foreground">{performer.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">{performer.deals} deals</p>
                      <p className="text-xs text-green-600 font-medium">
                        {formatCurrency(performer.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HorizontalLayout>
  );
}