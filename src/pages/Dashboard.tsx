import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText, 
  Calendar,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from "recharts"
import Dashboard from "@/components/Dashboard"

const dashboardData = [
  { month: 'Jan', leads: 65, revenue: 120000 },
  { month: 'Feb', leads: 85, revenue: 180000 },
  { month: 'Mar', leads: 92, revenue: 220000 },
  { month: 'Apr', leads: 78, revenue: 195000 },
  { month: 'May', leads: 105, revenue: 285000 },
  { month: 'Jun', leads: 118, revenue: 320000 },
]

const quickStats = [
  { title: "Total Leads", value: "542", change: "+12%", icon: Users, color: "text-blue-500" },
  { title: "Active Deals", value: "89", change: "+8%", icon: Target, color: "text-green-500" },
  { title: "Revenue", value: "$1.3M", change: "+15%", icon: DollarSign, color: "text-purple-500" },
  { title: "Conversion", value: "24%", change: "+3%", icon: TrendingUp, color: "text-orange-500" },
]

const recentActivities = [
  { id: 1, type: "lead", message: "New lead: John Smith - $250k loan", time: "2 hours ago", status: "new" },
  { id: 2, type: "deal", message: "Deal closed: ABC Corp - $500k", time: "4 hours ago", status: "success" },
  { id: 3, type: "document", message: "Document verified: Tax returns", time: "6 hours ago", status: "verified" },
  { id: 4, type: "meeting", message: "Meeting scheduled with Sarah Johnson", time: "1 day ago", status: "scheduled" },
]

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Center</h1>
          <p className="text-muted-foreground">
            Overview of your business performance and key metrics
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Business Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">{stat.change}</span>
                      <span>vs last month</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Lead Generation Trend
                  </CardTitle>
                  <CardDescription>
                    Monthly lead acquisition over the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Line 
                          type="monotone" 
                          dataKey="leads" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Revenue Growth
                  </CardTitle>
                  <CardDescription>
                    Monthly revenue trend and growth patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Original Dashboard Component */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Detailed Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive business overview and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Goal Progress
                  </CardTitle>
                  <CardDescription>
                    Monthly targets and achievement rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Lead Generation</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Revenue Target</span>
                      <span>72%</span>
                    </div>
                    <Progress value={72} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Conversion Rate</span>
                      <span>94%</span>
                    </div>
                    <Progress value={94} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Key Metrics
                  </CardTitle>
                  <CardDescription>
                    Important performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Deal Size</span>
                    <Badge variant="default">$285k</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sales Cycle</span>
                    <Badge variant="secondary">45 days</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Win Rate</span>
                    <Badge variant="default">68%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Satisfaction</span>
                    <Badge variant="default">4.8/5</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activity Feed
                </CardTitle>
                <CardDescription>
                  Latest updates and activities across your CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {activity.status === 'new' && <AlertCircle className="h-5 w-5 text-blue-500" />}
                        {activity.status === 'verified' && <CheckCircle className="h-5 w-5 text-purple-500" />}
                        {activity.status === 'scheduled' && <Clock className="h-5 w-5 text-orange-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}