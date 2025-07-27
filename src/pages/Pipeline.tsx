import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Users, Phone, Mail, Calendar } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

const pipelineStages = [
  {
    name: "Initial Contact",
    count: 45,
    value: "$3,450,000",
    leads: [
      { name: "John Smith", amount: "$200,000", priority: "high", lastContact: "1 hour ago" },
      { name: "Maria Garcia", amount: "$180,000", priority: "medium", lastContact: "3 hours ago" },
      { name: "Robert Kim", amount: "$220,000", priority: "low", lastContact: "1 day ago" },
    ]
  },
  {
    name: "Qualified",
    count: 32,
    value: "$2,890,000",
    leads: [
      { name: "Sarah Johnson", amount: "$450,000", priority: "high", lastContact: "2 hours ago" },
      { name: "Michael Chen", amount: "$320,000", priority: "medium", lastContact: "4 hours ago" },
      { name: "Lisa Wang", amount: "$520,000", priority: "high", lastContact: "5 hours ago" },
    ]
  },
  {
    name: "Application",
    count: 18,
    value: "$2,140,000",
    leads: [
      { name: "Emily Rodriguez", amount: "$275,000", priority: "high", lastContact: "1 day ago" },
      { name: "James Wilson", amount: "$340,000", priority: "medium", lastContact: "2 days ago" },
    ]
  },
  {
    name: "Pre-approval",
    count: 12,
    value: "$1,680,000",
    leads: [
      { name: "David Thompson", amount: "$180,000", priority: "low", lastContact: "2 days ago" },
      { name: "Anna Lee", amount: "$390,000", priority: "high", lastContact: "3 days ago" },
    ]
  },
  {
    name: "Closing",
    count: 8,
    value: "$980,000",
    leads: [
      { name: "Chris Brown", amount: "$250,000", priority: "high", lastContact: "1 day ago" },
    ]
  }
]

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
}

export default function Pipeline() {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const totalValue = pipelineStages.reduce((sum, stage) => {
    return sum + parseInt(stage.value.replace(/[$,]/g, ''))
  }, 0)

  const totalLeads = pipelineStages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track deals through your sales process</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalLeads}</div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ${(totalValue / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-muted-foreground">Pipeline Value</div>
          </div>
        </div>
      </div>

      {/* Conversion Rates */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {conversionRates.map((conversion) => (
              <div key={conversion.from} className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {conversion.from} → {conversion.to}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={conversion.rate} className="flex-1" />
                  <span className="text-sm font-medium text-foreground">{conversion.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loan Close Performance */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Loan Close Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Monthly closed loans vs targets and close percentage</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px]">
            <LineChart data={loanCloseData}>
              <XAxis 
                dataKey="month" 
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
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

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {pipelineStages.map((stage, index) => (
          <div key={stage.name} className="space-y-4">
            {/* Stage Header */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{stage.name}</CardTitle>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">{stage.count} leads</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="font-medium text-accent">{stage.value}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Stage Leads */}
            <div className="space-y-3">
              {stage.leads.map((lead, leadIndex) => (
                <Card key={leadIndex} className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-foreground">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.lastContact}</div>
                        </div>
                        <Badge variant={getPriorityColor(lead.priority)} className="text-xs">
                          {lead.priority}
                        </Badge>
                      </div>
                      
                      <div className="text-lg font-bold text-accent">
                        {lead.amount}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 p-1">
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 p-1">
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 p-1">
                          <Calendar className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Show more indicator */}
              {stage.count > stage.leads.length && (
                <Card className="shadow-soft border-dashed">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">
                      +{stage.count - stage.leads.length} more leads
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2">
                      View All
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
    </Layout>
  )
}