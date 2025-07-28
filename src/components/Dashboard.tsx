import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  Clock,
  Search,
  Filter,
  Eye,
  Edit,
  ChevronRight,
  Target,
  RefreshCw
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"

const metrics = [
  {
    title: "Total Pipeline Value",
    value: "$2,847,500",
    change: "+12.5%",
    icon: DollarSign,
    trend: "up"
  },
  {
    title: "Active Leads",
    value: "147",
    change: "+8.2%",
    icon: Users,
    trend: "up"
  },
  {
    title: "Applications This Month",
    value: "23",
    change: "+15.3%",
    icon: FileText,
    trend: "up"
  },
  {
    title: "Conversion Rate",
    value: "18.5%",
    change: "+2.1%",
    icon: TrendingUp,
    trend: "up"
  }
]

const recentLeads = [
  {
    name: "Sarah Johnson",
    amount: "$450,000",
    stage: "Pre-approval",
    lastContact: "2 hours ago",
    priority: "high"
  },
  {
    name: "Michael Chen",
    amount: "$320,000",
    stage: "Application",
    lastContact: "4 hours ago",
    priority: "medium"
  },
  {
    name: "Emily Rodriguez",
    amount: "$275,000",
    stage: "Initial Contact",
    lastContact: "1 day ago",
    priority: "high"
  },
  {
    name: "David Thompson",
    amount: "$180,000",
    stage: "Documentation",
    lastContact: "2 days ago",
    priority: "low"
  }
]

const pipelineStages = [
  { name: "Initial Contact", count: 45, percentage: 30 },
  { name: "Qualified", count: 32, percentage: 65 },
  { name: "Application", count: 18, percentage: 75 },
  { name: "Pre-approval", count: 12, percentage: 85 },
  { name: "Closing", count: 8, percentage: 95 }
]

const todayActivities = [
  {
    type: "call",
    title: "Follow up call with Sarah Johnson",
    time: "10:00 AM",
    priority: "high"
  },
  {
    type: "email",
    title: "Send documents to Michael Chen",
    time: "11:30 AM",
    priority: "medium"
  },
  {
    type: "meeting",
    title: "Loan consultation with new prospect",
    time: "2:00 PM",
    priority: "high"
  },
  {
    type: "call",
    title: "Check on Emily Rodriguez application",
    time: "4:00 PM",
    priority: "medium"
  }
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

export default function Dashboard() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<typeof recentLeads[0] | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pipelineFilter, setPipelineFilter] = useState("")
  const [leadsFilter, setLeadsFilter] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000) // Update every second

    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
    return date.toLocaleDateString('en-US', options)
  }

  const handleMetricClick = (metric: typeof metrics[0]) => {
    // Navigate to relevant pages based on metric type
    switch (metric.title) {
      case "Total Pipeline Value":
        navigate("/pipeline")
        break
      case "Active Leads":
        navigate("/leads")
        break
      case "Applications This Month":
        navigate("/documents")
        break
      case "Conversion Rate":
        navigate("/reports")
        break
      default:
        toast({
          title: "Metric Details",
          description: `Viewing ${metric.title}: ${metric.value}`,
        })
    }
  }

  const handleLeadClick = (lead: typeof recentLeads[0]) => {
    // Navigate to leads page and potentially open lead details
    navigate("/leads", { state: { selectedLead: lead } })
  }

  const handleRefreshData = () => {
    setIsRefreshing(true)
    toast({
      title: "Refreshing Data",
      description: "Updating dashboard with latest information...",
    })
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data Updated",
        description: "Dashboard has been refreshed with the latest data.",
      })
    }, 2000)
  }

  const handleActivityClick = (activity: typeof todayActivities[0]) => {
    // Navigate to activities page or perform action based on activity type
    if (activity.type === "call") {
      // Could integrate with phone system
      toast({
        title: "Initiating Call",
        description: `Starting call: ${activity.title}`,
      })
    } else if (activity.type === "email") {
      // Could open email composer
      navigate("/activities")
    } else {
      navigate("/activities")
    }
  }

  const filteredPipelineStages = pipelineStages.filter(stage =>
    stage.name.toLowerCase().includes(pipelineFilter.toLowerCase())
  )

  const filteredLeads = recentLeads.filter(lead =>
    lead.name.toLowerCase().includes(leadsFilter.toLowerCase()) ||
    lead.stage.toLowerCase().includes(leadsFilter.toLowerCase())
  )

  const handlePipelineStageClick = (stage: typeof pipelineStages[0]) => {
    // Navigate to leads page filtered by this stage
    navigate("/leads", { state: { filterByStage: stage.name } })
  }

  const handleNewLeadClick = () => {
    // Navigate to leads page with add dialog open
    navigate("/leads", { state: { openAddDialog: true } })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your performance overview.</p>
          <p className="text-sm text-muted-foreground mt-1">{formatDateTime(currentDateTime)}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-gradient-primary shadow-medium" onClick={handleNewLeadClick}>
            New Lead
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card 
            key={metric.title} 
            className="shadow-soft hover:shadow-medium transition-all cursor-pointer hover:scale-105"
            onClick={() => handleMetricClick(metric)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <metric.icon className="h-4 w-4 text-white" />
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-accent">
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <Card className="col-span-2 shadow-soft">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Sales Pipeline</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter stages..."
                    value={pipelineFilter}
                    onChange={(e) => setPipelineFilter(e.target.value)}
                    className="pl-10 w-40"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPipelineStages.map((stage) => (
                <div 
                  key={stage.name} 
                  className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handlePipelineStageClick(stage)}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{stage.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{stage.count} leads</span>
                      <Target className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <Progress value={stage.percentage} className="h-3 hover:h-4 transition-all" />
                  <div className="text-xs text-muted-foreground text-right">{stage.percentage}% completion</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Activities */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Today's Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  {activity.type === 'call' && <Phone className="w-4 h-4 text-white mt-0.5" />}
                  {activity.type === 'email' && <Mail className="w-4 h-4 text-white mt-0.5" />}
                  {activity.type === 'meeting' && <Calendar className="w-4 h-4 text-white mt-0.5" />}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <Badge 
                        variant={activity.priority === 'high' ? 'destructive' : 
                                activity.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.priority}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Close Performance */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Loan Close Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Monthly closed loans vs targets and close percentage</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
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

      {/* Recent Leads */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Leads</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={leadsFilter}
                onChange={(e) => setLeadsFilter(e.target.value)}
                className="pl-10 w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border hover:shadow-medium transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => handleLeadClick(lead)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{lead.stage}</Badge>
                  <span className="text-sm text-muted-foreground">{lead.lastContact}</span>
                  <Badge 
                    variant={lead.priority === 'high' ? 'destructive' : 
                            lead.priority === 'medium' ? 'default' : 'secondary'}
                  >
                    {lead.priority}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
                  <p className="text-muted-foreground">{selectedLead.amount}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stage</label>
                  <Badge variant="outline" className="mt-1">{selectedLead.stage}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <Badge 
                    variant={selectedLead.priority === 'high' ? 'destructive' : 
                            selectedLead.priority === 'medium' ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {selectedLead.priority}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Contact</label>
                <p className="text-sm">{selectedLead.lastContact}</p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => {
                    toast({
                      title: "Initiating Call",
                      description: `Calling ${selectedLead.name}...`,
                    })
                  }}
                >
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => {
                    navigate("/activities")
                    toast({
                      title: "Email Composer",
                      description: `Opening email to ${selectedLead.name}...`,
                    })
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => {
                    navigate("/leads", { state: { editLead: selectedLead } })
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
