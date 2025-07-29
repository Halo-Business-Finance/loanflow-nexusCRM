import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { BarChart3, TrendingUp, DollarSign, Users, FileText, Calendar, Download, Filter, RefreshCw } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { useReportsData } from "@/hooks/useReportsData"

export default function Reports() {
  const { reportData, monthlyData, topPerformers, loading, refetch } = useReportsData()

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground">Performance insights and business metrics</p>
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
              <p className="text-muted-foreground">Performance insights and business metrics</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-muted-foreground">No data available</p>
                <Button onClick={refetch} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
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
            <p className="text-muted-foreground">Performance insights and business metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" />
                Loan Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-accent">{reportData.loanVolume.thisMonth}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {reportData.loanVolume.growth}
                  </Badge>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target: {reportData.loanVolume.target}</span>
                    <span>{reportData.loanVolume.completion}%</span>
                  </div>
                  <Progress value={reportData.loanVolume.completion} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{reportData.applications.total}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-green-600">{reportData.applications.approved}</div>
                    <div className="text-muted-foreground">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-orange-600">{reportData.applications.pending}</div>
                    <div className="text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">{reportData.applications.rejected}</div>
                    <div className="text-muted-foreground">Rejected</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">Approval Rate</div>
                  <div className="text-lg font-bold">{reportData.applications.approvalRate}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                  <div className="text-lg font-bold">{reportData.performance.avgProcessingTime}</div>
                  <div className="text-xs text-green-600">{reportData.performance.improvement} from target</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                  <div className="text-lg font-bold">{reportData.performance.customerSatisfaction}/5.0</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{reportData.teamActivity.activeLoanOfficers}</div>
                <div className="text-sm text-muted-foreground">Active Loan Officers</div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">This Month's Activity</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="font-medium">{reportData.teamActivity.loansProcessed}</div>
                      <div className="text-muted-foreground">Loans Processed</div>
                    </div>
                    <div>
                      <div className="font-medium">{reportData.teamActivity.customerContacts}</div>
                      <div className="text-muted-foreground">Customer Contacts</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
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
                    className="text-muted-foreground text-sm"
                  />
                  <YAxis 
                    yAxisId="loans"
                    orientation="left"
                    className="text-muted-foreground text-sm"
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis 
                    yAxisId="volume"
                    orientation="right"
                    className="text-muted-foreground text-sm"
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
            <CardTitle>Top Performers</CardTitle>
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
                        <div className="font-medium">{performer.name}</div>
                        <div className="text-sm text-muted-foreground">Loan Officer</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="font-bold">{performer.loans}</div>
                        <div className="text-xs text-muted-foreground">Loans</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-accent">{performer.volume}</div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{Math.round(performer.rate)}%</div>
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
      </div>
    </Layout>
  )
}