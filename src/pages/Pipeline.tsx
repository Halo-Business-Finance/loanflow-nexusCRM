import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Users, Phone, Mail, Calendar } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from "recharts"
import { InteractivePipeline } from "@/components/InteractivePipeline"


interface PipelineEntry {
  id: string
  stage: string
  amount: number
  priority: string
  last_contact: string
  lead?: {
    name: string
  }
  client?: {
    name: string
  }
}

interface StageData {
  name: string
  count: number
  value: number
  entries: PipelineEntry[]
}

const conversionRates = [
  { from: "Initial Contact", to: "Qualified", rate: 71 },
  { from: "Qualified", to: "Application", rate: 56 },
  { from: "Application", to: "Pre-approval", rate: 67 },
  { from: "Pre-approval", to: "Closing", rate: 67 },
]

const loanCloseData = [
  { month: "Jan", closedLoans: 12, targetLoans: 15, avgDays: 28, closePercentage: 80 },
  { month: "Feb", closedLoans: 18, targetLoans: 20, avgDays: 25, closePercentage: 90 },
  { month: "Mar", closedLoans: 22, targetLoans: 25, avgDays: 23, closePercentage: 88 },
  { month: "Apr", closedLoans: 19, targetLoans: 22, avgDays: 26, closePercentage: 86 },
  { month: "May", closedLoans: 25, targetLoans: 28, avgDays: 22, closePercentage: 89 },
  { month: "Jun", closedLoans: 30, targetLoans: 30, avgDays: 20, closePercentage: 100 },
]

const velocityData = [
  { stage: "Initial Contact", avgDays: 5, leadCount: 45 },
  { stage: "Qualification", avgDays: 8, leadCount: 32 },
  { stage: "Proposal", avgDays: 12, leadCount: 18 },
  { stage: "Negotiation", avgDays: 15, leadCount: 12 },
  { stage: "Closing", avgDays: 22, leadCount: 8 },
]

const performanceData = [
  { name: "Lead Generation", value: 85, color: "#8884d8" },
  { name: "Qualification", value: 72, color: "#82ca9d" },
  { name: "Proposal", value: 56, color: "#ffc658" },
  { name: "Closing", value: 68, color: "#ff7300" },
]

const pipelineValueData = [
  { month: "Jan", value: 1200000, leads: 45 },
  { month: "Feb", value: 1450000, leads: 52 },
  { month: "Mar", value: 1680000, leads: 48 },
  { month: "Apr", value: 1520000, leads: 41 },
  { month: "May", value: 1850000, leads: 55 },
  { month: "Jun", value: 2100000, leads: 62 },
]

const chartConfig = {
  closedLoans: {
    label: "Closed Loans",
    color: "hsl(var(--primary))",
  },
  targetLoans: {
    label: "Target Loans",
    color: "hsl(var(--accent))",
  },
  closePercentage: {
    label: "Close %",
    color: "hsl(var(--destructive))",
  },
  value: {
    label: "Pipeline Value",
    color: "hsl(var(--primary))",
  },
  leads: {
    label: "Number of Leads",
    color: "hsl(var(--accent))",
  },
}

const stageOrder = ["Initial Contact", "Qualified", "Application", "Pre-approval", "Closing", "Funded"]

export default function Pipeline() {
  const { user } = useAuth()
  const [pipelineData, setPipelineData] = useState<StageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPipelineData()
    }
  }, [user])

  const fetchPipelineData = async () => {
    try {
      const { data, error } = await supabase
        .from('pipeline_entries')
        .select(`
          *,
          lead:leads(*, contact_entity:contact_entities(*)),
          client:clients(*, contact_entity:contact_entities(*))
        `)

      if (error) throw error

      // Group by stage
      const stageGroups: { [key: string]: PipelineEntry[] } = {}
      stageOrder.forEach(stage => {
        stageGroups[stage] = []
      })

      data?.forEach(entry => {
        if (stageGroups[entry.stage]) {
          // Merge lead/client data with contact entity
          const enrichedEntry = {
            ...entry,
            lead: entry.lead ? {
              ...entry.lead,
              name: entry.lead.contact_entity?.name || '',
              email: entry.lead.contact_entity?.email || ''
            } : null,
            client: entry.client ? {
              ...entry.client,
              name: entry.client.contact_entity?.name || '',
              email: entry.client.contact_entity?.email || ''
            } : null
          }
          stageGroups[entry.stage].push(enrichedEntry)
        }
      })

      const stages: StageData[] = stageOrder.map(stageName => {
        const entries = stageGroups[stageName] || []
        const totalValue = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0)
        
        return {
          name: stageName,
          count: entries.length,
          value: totalValue,
          entries: entries.slice(0, 3) // Show only first 3 for display
        }
      })

      setPipelineData(stages)
    } catch (error) {
      console.error('Error fetching pipeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const totalValue = pipelineData.reduce((sum, stage) => sum + stage.value, 0)
  const totalLeads = pipelineData.reduce((sum, stage) => sum + stage.count, 0)

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Sales Pipeline</h1>
          <p className="text-foreground">Track deals through your sales process</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground dark:text-white">{totalLeads}</div>
            <div className="text-sm text-foreground">Total Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground dark:text-white">
              ${(totalValue / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-foreground">Pipeline Value</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="interactive" className="w-full">
        <TabsList>
          <TabsTrigger value="interactive">Interactive Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interactive" className="space-y-6">
          <InteractivePipeline />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          {/* Loan Close Performance */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="dark:text-white">Loan Close Performance</CardTitle>
              <p className="text-sm text-muted-foreground dark:text-white">Monthly closed loans vs targets and close percentage</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <LineChart data={loanCloseData}>
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                  />
                  <YAxis 
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(label) => `${label} 2024`}
                        formatter={(value, name) => [
                          name === "closePercentage" ? `${value}%` : value,
                          name === "closedLoans" ? "Closed" : 
                          name === "targetLoans" ? "Target" : "Close %"
                        ]}
                      />
                    }
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="closedLoans"
                    stroke="var(--color-closedLoans)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-closedLoans)", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "var(--color-closedLoans)", strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="targetLoans"
                    stroke="var(--color-targetLoans)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "var(--color-targetLoans)", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="closePercentage"
                    stroke="var(--color-closePercentage)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-closePercentage)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "var(--color-closePercentage)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pipeline Value Trend */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="dark:text-white">Pipeline Value Trend</CardTitle>
              <p className="text-sm text-muted-foreground dark:text-white">Monthly pipeline value and lead count over time</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <AreaChart data={pipelineValueData}>
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                  />
                  <YAxis 
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(label) => `${label} 2024`}
                        formatter={(value, name) => [
                          name === "value" ? `$${(Number(value) / 1000000).toFixed(1)}M` : value,
                          name === "value" ? "Pipeline Value" : "Leads"
                        ]}
                      />
                    }
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    fill="var(--color-value)"
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="leads"
                    stroke="var(--color-leads)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-leads)", strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Sales Velocity */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="dark:text-white">Sales Velocity by Stage</CardTitle>
              <p className="text-sm text-muted-foreground dark:text-white">Average days in each stage and lead count</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <ComposedChart data={velocityData}>
                  <XAxis 
                    dataKey="stage" 
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground dark:text-white"
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name) => [
                          name === "avgDays" ? `${value} days` : `${value} leads`,
                          name === "avgDays" ? "Avg Days" : "Lead Count"
                        ]}
                      />
                    }
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="avgDays"
                    fill="var(--color-value)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="leadCount"
                    stroke="var(--color-leads)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-leads)", strokeWidth: 2, r: 6 }}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="dark:text-white">Performance Metrics</CardTitle>
              <p className="text-sm text-muted-foreground dark:text-white">Key performance indicators by stage</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ChartContainer config={chartConfig} className="h-full">
                    <PieChart>
                      <Pie
                        data={performanceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ChartContainer>
                </div>
                
                <div className="space-y-4">
                  {performanceData.map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium dark:text-white">{metric.name}</span>
                        <span className="text-sm font-bold dark:text-white">{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rates */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="dark:text-white">Stage Conversion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {conversionRates.map((conversion) => (
                  <div key={conversion.from} className="space-y-2">
                    <div className="text-sm font-medium text-foreground dark:text-white">
                      {conversion.from} → {conversion.to}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={conversion.rate} className="flex-1" />
                      <span className="text-sm font-medium text-foreground dark:text-white">{conversion.rate}%</span>
                    </div>
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