import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { TodaysTasks } from "@/components/TodaysTasks"
import { AdminAITools } from "@/components/AdminAITools"
import { useAuth } from "@/components/auth/AuthProvider"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { formatNumber, formatCurrency } from "@/lib/utils"

// Initial metrics structure - will be updated with real data
const initialMetrics = [
  {
    title: "Total Pipeline Value",
    value: "$0",
    change: "0%",
    trend: "neutral"
  },
  {
    title: "Total Leads",
    value: "0",
    change: "0%",
    trend: "neutral"
  },
  {
    title: "Active Leads",
    value: "0",
    change: "0%",
    trend: "neutral"
  },
  {
    title: "Applications This Month",
    value: "0",
    change: "0%",
    trend: "neutral"
  },
  {
    title: "Conversion Rate",
    value: "0%",
    change: "0%",
    trend: "neutral"
  }
]

import { Lead } from "@/types/lead"

interface PipelineEntry {
  id: string;
  stage: string;
  amount?: number;
  created_at: string;
  lead_id?: string;
}

interface PipelineStage {
  name: string;
  count: number;
  percentage: number;
}

const recentLeads: Array<{
  name: string;
  amount: string;
  stage: string;
  lastContact: string;
  priority: string;
}> = []

// Initial pipeline stages - will be updated with real data
const initialPipelineStages = [
  { name: "Initial Contact", count: 0, percentage: 0 },
  { name: "Qualified", count: 0, percentage: 0 },
  { name: "Application", count: 0, percentage: 0 },
  { name: "Pre-approval", count: 0, percentage: 0 },
  { name: "Closing", count: 0, percentage: 0 }
]

const todayActivities: Array<{
  type: string;
  title: string;
  time: string;
  priority: string;
}> = []

const loanCloseData = [
  { month: "Jan", closedLoans: 0, targetLoans: 0, avgDays: 0, closePercentage: 0 },
  { month: "Feb", closedLoans: 0, targetLoans: 0, avgDays: 0, closePercentage: 0 },
  { month: "Mar", closedLoans: 0, targetLoans: 0, avgDays: 0, closePercentage: 0 },
  { month: "Apr", closedLoans: 0, targetLoans: 0, avgDays: 0, closePercentage: 0 },
  { month: "May", closedLoans: 0, targetLoans: 0, avgDays: 0, closePercentage: 0 },
  { month: "Jun", closedLoans: 0, targetLoans: 0, avgDays: 0, closePercentage: 0 },
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
  const { user, hasRole } = useAuth()
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<typeof recentLeads[0] | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pipelineFilter, setPipelineFilter] = useState("")
  const [leadsFilter, setLeadsFilter] = useState("")
  
  // State for real data
  const [metrics, setMetrics] = useState(initialMetrics)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(initialPipelineStages)
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipelineEntries, setPipelineEntries] = useState<PipelineEntry[]>([])
  const [totalClients, setTotalClients] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000) // Update every second

    return () => clearInterval(timer)
  }, [])

  // Fetch dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      console.log('Current user:', user.id)
      console.log('User roles:', hasRole('admin'), hasRole('super_admin'))
      
      // Fetch ALL leads with contact entity data for now to debug
      const { data: leadsData } = await supabase
        .from('leads')
        .select(`
          *,
          contact_entity:contact_entities!contact_entity_id (*)
        `)
        .order('created_at', { ascending: false })

      console.log('Fetched leads data:', leadsData)

      // Fetch pipeline entries  
      const { data: pipelineData } = await supabase
        .from('pipeline_entries')
        .select('*')

      // Fetch clients count
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, total_loan_value')

      // Transform leads data to merge contact entity fields
      const transformedLeads = leadsData?.map(lead => ({
        ...lead,
        ...lead.contact_entity
      })) || []

      console.log('Transformed leads:', transformedLeads)

      if (transformedLeads) setLeads(transformedLeads)
      if (pipelineData) setPipelineEntries(pipelineData)
      if (clientsData) setTotalClients(clientsData.length)

      // Calculate pipeline stages
      calculatePipelineStages(transformedLeads, pipelineData || [])
      
      // Calculate metrics
      calculateMetrics(transformedLeads, clientsData || [], pipelineData || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    }
  }

  const calculatePipelineStages = (leadsData: Lead[], pipelineData: PipelineEntry[]) => {
    const stageCounts = {
      "Initial Contact": 0,
      "Qualified": 0, 
      "Application": 0,
      "Pre-approval": 0,
      "Closing": 0,
      "Funded": 0
    }

    // Count active (non-converted) leads by their current stage
    leadsData.forEach(lead => {
      // Only count leads that haven't been converted to clients for active pipeline
      if (!lead.is_converted_to_client && stageCounts.hasOwnProperty(lead.stage)) {
        stageCounts[lead.stage as keyof typeof stageCounts]++
      }
    })

    // Count pipeline entries (these represent active deals)
    pipelineData.forEach(entry => {
      if (stageCounts.hasOwnProperty(entry.stage)) {
        stageCounts[entry.stage as keyof typeof stageCounts]++
      }
    })

    // Calculate total for percentage calculation
    const total = Object.values(stageCounts).reduce((sum, count) => sum + count, 0)

    // Create pipeline stages with percentages
    const stages: PipelineStage[] = Object.entries(stageCounts).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))

    setPipelineStages(stages)
  }

  const calculateMetrics = (leadsData: Lead[], clientsData: any[], pipelineData: PipelineEntry[]) => {
    // Calculate total pipeline value for ACTIVE deals only
    // 1. Count non-converted leads (active pipeline)
    const activeLeadsValue = leadsData.reduce((sum, lead) => {
      if (lead.is_converted_to_client) return sum // Skip converted leads
      // Use the loan_amount from the merged contact entity data
      return sum + (lead.loan_amount || 0)
    }, 0)
    
    // 2. Count all pipeline entries (these represent additional active deals)
    const pipelineValue = pipelineData.reduce((sum, entry) => {
      return sum + (entry.amount || 0)
    }, 0)
    
    // Total active pipeline value
    const totalPipelineValue = activeLeadsValue + pipelineValue

    // Calculate applications this month (include all application-stage activities)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const applicationsThisMonth = leadsData.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate.getMonth() === currentMonth && 
             leadDate.getFullYear() === currentYear &&
             // Use the stage from the merged contact entity data
             ['Application', 'Pre-approval'].includes(lead.stage || '')
    }).length

    // Calculate conversion rate (converted leads / total leads)
    const convertedLeads = leadsData.filter(lead => lead.is_converted_to_client).length
    const conversionRate = leadsData.length > 0 ? 
      Math.round((convertedLeads / leadsData.length) * 100) : 0

    // Count only active (non-converted) leads for "Active Leads" metric
    const activeLeadsCount = leadsData.filter(lead => !lead.is_converted_to_client).length

    // Update metrics
    setMetrics([
      {
        title: "Total Pipeline Value",
        value: formatCurrency(totalPipelineValue),
        change: "+0%", // Could calculate based on previous period
        trend: "neutral"
      },
      {
        title: "Total Leads", 
        value: formatNumber(leadsData.length),
        change: "+0%",
        trend: "neutral"
      },
      {
        title: "Active Leads", 
        value: formatNumber(activeLeadsCount),
        change: "+0%",
        trend: "neutral"
      },
      {
        title: "Applications This Month",
        value: formatNumber(applicationsThisMonth),
        change: "+0%",
        trend: "neutral"
      },
      {
        title: "Conversion Rate",
        value: `${formatNumber(conversionRate)}%`,
        change: "+0%",
        trend: "neutral"
      }
    ])
  }

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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
    
    fetchDashboardData().finally(() => {
      setIsRefreshing(false)
      toast({
        title: "Data Updated", 
        description: "Dashboard has been refreshed with the latest data.",
      })
    })
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

  const filteredLeads = leads.filter(lead =>
    (lead.name || '').toLowerCase().includes(leadsFilter.toLowerCase()) ||
    (lead.stage || '').toLowerCase().includes(leadsFilter.toLowerCase())
  ).map(lead => ({
    name: lead.name || 'N/A',
    amount: formatCurrency(lead.loan_amount || 0),
    loanType: lead.loan_type || 'N/A',
    stage: lead.stage || 'N/A',
    lastContact: lead.last_contact ? new Date(lead.last_contact).toLocaleDateString() : 'N/A',
    priority: lead.priority || 'medium'
  }))

  const handlePipelineStageClick = (stage: typeof pipelineStages[0]) => {
    // Navigate to leads page filtered by this stage
    navigate("/leads", { state: { filterByStage: stage.name } })
  }

  const handleNewLeadClick = () => {
    // Navigate to leads page with add dialog open
    navigate("/leads", { state: { openAddDialog: true } })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-8 p-6 bg-gradient-to-br from-background via-background/95 to-background/90 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-8 border border-border/30 shadow-large">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">Welcome back! Here's your performance overview.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{formatDateTime(currentDateTime)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="modern" 
                  size="lg"
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                  className="gap-3 h-12 px-6 rounded-xl shadow-md backdrop-blur-sm"
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh all dashboard data with the latest information from the database</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="gradient" 
                  size="lg"
                  className="gap-3 h-12 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={handleNewLeadClick}
                >
                  <Users className="h-5 w-5" />
                  New Lead
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new lead and add them to your pipeline</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {metrics.map((metric, index) => (
          <Card 
            key={metric.title} 
            className="relative overflow-hidden bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl border border-border/30 shadow-large hover:shadow-glow transition-all duration-500 cursor-pointer hover:scale-105 group rounded-2xl"
            onClick={() => handleMetricClick(metric)}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {metric.title}
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {index === 0 && <DollarSign className="h-4 w-4 text-primary" />}
                {index === 1 && <Users className="h-4 w-4 text-accent" />}
                {index === 2 && <Target className="h-4 w-4 text-primary" />}
                {index === 3 && <FileText className="h-4 w-4 text-accent" />}
                {index === 4 && <TrendingUp className="h-4 w-4 text-primary" />}
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
                {metric.value}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-accent px-2 py-1 bg-accent/10 rounded-full">
                  {metric.change}
                </span>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Overview */}
        <Card className="col-span-2 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl border border-border/30 shadow-large rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-card/50 to-transparent">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Sales Pipeline
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter stages..."
                    value={pipelineFilter}
                    onChange={(e) => setPipelineFilter(e.target.value)}
                    className="pl-10 w-48 rounded-xl bg-background/50 backdrop-blur-sm border-border/30"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {filteredPipelineStages.map((stage, index) => (
                <div 
                  key={stage.name} 
                  className="group relative p-4 rounded-xl bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/20 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.02]"
                  onClick={() => handlePipelineStageClick(stage)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  
                  <div className="relative z-10 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <span className="font-semibold text-foreground">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                          {stage.count} leads
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Progress 
                        value={stage.percentage} 
                        className="h-3 rounded-full bg-background/50 group-hover:h-4 transition-all duration-300" 
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-primary">{stage.percentage}% completion</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <TodaysTasks />
      </div>

      {/* Loan Close Performance */}
      <Card className="bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl border border-border/30 shadow-large rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-gradient-to-r from-card/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Loan Close Performance
              </CardTitle>
              <p className="text-sm text-muted-foreground">Monthly closed loans vs targets and close percentage</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm rounded-xl p-4 border border-border/20">
            <ChartContainer config={chartConfig} className="h-[320px]">
              <LineChart data={loanCloseData}>
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--foreground)', fontSize: 12 }}
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
          </div>
        </CardContent>
      </Card>

      {/* Recent Leads */}
      <Card className="bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl border border-border/30 shadow-large rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-gradient-to-r from-card/50 to-transparent">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Recent Leads
              </CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={leadsFilter}
                onChange={(e) => setLeadsFilter(e.target.value)}
                className="pl-10 w-48 rounded-xl bg-background/50 backdrop-blur-sm border-border/30"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredLeads.map((lead, index) => (
              <div 
                key={`lead-${index}-${lead.name}`}
                className="group relative p-5 rounded-xl bg-gradient-to-r from-background/60 to-background/40 backdrop-blur-sm border border-border/20 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                onClick={() => handleLeadClick(lead)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">{lead.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm font-medium text-primary">{lead.amount}</p>
                        <Badge variant="outline" className="text-xs bg-background/50">
                          {lead.loanType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className="mb-2 bg-background/50 backdrop-blur-sm"
                      >
                        {lead.stage}
                      </Badge>
                      <p className="text-xs text-muted-foreground">Last: {lead.lastContact}</p>
                    </div>
                    <Badge 
                      variant={lead.priority === 'high' ? 'destructive' : 
                              lead.priority === 'medium' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {lead.priority}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin AI Tools */}
      {hasRole('admin') && (
        <AdminAITools />
      )}

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
                  <Users className="w-6 h-6 text-primary-foreground" />
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
  </TooltipProvider>
  )
}
