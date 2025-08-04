import { useState } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BarChart3, TrendingUp, DollarSign, Users, FileText, Calendar, Download, Filter, RefreshCw, ArrowLeft } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { useReportsData } from "@/hooks/useReportsData"

export default function Reports() {
  const { reportData, monthlyData, topPerformers, loading, refetch } = useReportsData()
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  // Sample data for detailed graphs
  const loanVolumeData = [
    { month: 'Jan', volume: 2400000, target: 3000000 },
    { month: 'Feb', volume: 1398000, target: 3000000 },
    { month: 'Mar', volume: 9800000, target: 3000000 },
    { month: 'Apr', volume: 3908000, target: 3000000 },
    { month: 'May', volume: 4800000, target: 3000000 },
    { month: 'Jun', volume: 3800000, target: 3000000 },
  ]

  const applicationsData = [
    { status: 'Approved', count: reportData?.applications.approved || 0, color: '#22c55e' },
    { status: 'Pending', count: reportData?.applications.pending || 0, color: '#f59e0b' },
    { status: 'Rejected', count: reportData?.applications.rejected || 0, color: '#ef4444' },
  ]

  const performanceData = [
    { metric: 'Processing Time', current: 12, target: 15, unit: 'days' },
    { metric: 'Approval Rate', current: 85, target: 80, unit: '%' },
    { metric: 'Customer Satisfaction', current: 4.2, target: 4.0, unit: '/5' },
    { metric: 'Response Time', current: 2, target: 3, unit: 'hours' },
  ]

  const teamActivityData = [
    { name: 'John Smith', loansProcessed: 23, customerContacts: 45, completionRate: 92 },
    { name: 'Sarah Johnson', loansProcessed: 19, customerContacts: 38, completionRate: 88 },
    { name: 'Mike Davis', loansProcessed: 16, customerContacts: 32, completionRate: 85 },
    { name: 'Emily Brown', loansProcessed: 14, customerContacts: 28, completionRate: 90 },
    { name: 'Robert Wilson', loansProcessed: 12, customerContacts: 25, completionRate: 87 },
  ]

  const openMetricDetail = (metric: string) => {
    setSelectedMetric(metric)
  }

  const closeMetricDetail = () => {
    setSelectedMetric(null)
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-foreground">Performance insights and business metrics</p>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </Layout>
    )
  }

  if (!reportData) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-foreground">Performance insights and business metrics</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-muted-foreground">No data available</p>
                <Button onClick={refetch} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2 text-white" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-foreground">Performance insights and business metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={refetch}>
              <RefreshCw className="h-4 w-4 text-white" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4 text-white" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4 text-white" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={() => openMetricDetail('loanVolume')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <DollarSign className="h-4 w-4 text-white" />
                Loan Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">{reportData.loanVolume.thisMonth}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {reportData.loanVolume.growth}
                  </Badge>
                  <span className="text-sm text-foreground">vs last month</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Target: {reportData.loanVolume.target}</span>
                    <span className="text-foreground">{reportData.loanVolume.completion}%</span>
                  </div>
                  <Progress value={reportData.loanVolume.completion} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">Click to view details</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={() => openMetricDetail('applications')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-white" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">{reportData.applications.total}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-green-400 dark:text-green-300">{reportData.applications.approved}</div>
                    <div className="text-foreground">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-orange-400 dark:text-orange-300">{reportData.applications.pending}</div>
                    <div className="text-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-400 dark:text-red-300">{reportData.applications.rejected}</div>
                    <div className="text-foreground">Rejected</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-foreground">Approval Rate</div>
                  <div className="text-lg font-bold text-foreground">{reportData.applications.approvalRate}%</div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Click to view details</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={() => openMetricDetail('performance')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <TrendingUp className="h-4 w-4 text-white" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-foreground">Avg Processing Time</div>
                  <div className="text-lg font-bold text-foreground">{reportData.performance.avgProcessingTime}</div>
                  <div className="text-xs text-green-400 dark:text-green-300">{reportData.performance.improvement} from target</div>
                </div>
                <div>
                  <div className="text-sm text-foreground">Customer Satisfaction</div>
                  <div className="text-lg font-bold text-foreground">{reportData.performance.customerSatisfaction}/5.0</div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Click to view details</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={() => openMetricDetail('teamActivity')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-white" />
                Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">{reportData.teamActivity.activeLoanOfficers}</div>
                <div className="text-sm text-foreground">Active Loan Officers</div>
                <div className="space-y-1">
                  <div className="text-xs text-foreground">This Month's Activity</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="font-medium text-foreground">{reportData.teamActivity.loansProcessed}</div>
                      <div className="text-foreground">Loans Processed</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{reportData.teamActivity.customerContacts}</div>
                      <div className="text-foreground">Customer Contacts</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Click to view details</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5 text-white" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="loans"
                    orientation="left"
                    tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis 
                    yAxisId="volume"
                    orientation="right"
                    tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'loans' ? `${value} loans` : `$${(value / 1000000).toFixed(1)}M`,
                      name === 'loans' ? 'Loans' : 'Volume'
                    ]}
                    labelFormatter={(label: string) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    yAxisId="loans"
                    type="monotone"
                    dataKey="loans"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="volume"
                    type="monotone"
                    dataKey="volume"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div key={performer.user_id} className="flex items-center justify-between p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{performer.name}</div>
                        <div className="text-sm text-muted-foreground">Loan Officer</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="font-bold text-foreground">{performer.loans}</div>
                        <div className="text-xs text-muted-foreground">Loans</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">{performer.volume}</div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">{Math.round(performer.rate)}%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metric Dialogs */}
        <Dialog open={selectedMetric === 'loanVolume'} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan Volume Analysis
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loanVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--foreground)', fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `$${(value / 1000000).toFixed(1)}M`,
                        name === 'volume' ? 'Actual Volume' : 'Target Volume'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="volume" fill="hsl(var(--primary))" name="volume" />
                    <Bar dataKey="target" fill="hsl(var(--muted))" name="target" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">$3.8M</div>
                      <div className="text-sm text-muted-foreground">This Month</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">+27%</div>
                      <div className="text-sm text-muted-foreground">Growth Rate</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">127%</div>
                      <div className="text-sm text-muted-foreground">Target Achievement</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={selectedMetric === 'applications'} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Applications Breakdown
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={applicationsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {applicationsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3">
                  {applicationsData.map((item) => (
                    <Card key={item.status}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.status}</span>
                          </div>
                          <span className="text-2xl font-bold">{item.count}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{reportData?.applications.approvalRate}%</div>
                      <div className="text-sm text-muted-foreground">Overall Approval Rate</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={selectedMetric === 'performance'} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                    <YAxis dataKey="metric" type="category" tick={{ fill: 'var(--foreground)', fontSize: 12 }} width={120} />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value}${props.payload.unit}`,
                        name === 'current' ? 'Current' : 'Target'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="current" fill="hsl(var(--primary))" name="current" />
                    <Bar dataKey="target" fill="hsl(var(--muted))" name="target" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {performanceData.map((metric) => (
                  <Card key={metric.metric}>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">{metric.current}{metric.unit}</div>
                        <div className="text-sm text-muted-foreground">{metric.metric}</div>
                        <div className="text-xs mt-1">
                          Target: {metric.target}{metric.unit}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={selectedMetric === 'teamActivity'} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Activity Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamActivityData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--foreground)', fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar yAxisId="left" dataKey="loansProcessed" fill="hsl(var(--primary))" name="Loans Processed" />
                    <Bar yAxisId="right" dataKey="completionRate" fill="hsl(var(--accent))" name="Completion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-3">
                {teamActivityData.map((member) => (
                  <Card key={member.name}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{member.name}</div>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Loans: </span>
                            <span className="font-bold">{member.loansProcessed}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Contacts: </span>
                            <span className="font-bold">{member.customerContacts}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rate: </span>
                            <span className="font-bold">{member.completionRate}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}