import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
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
      // Fetch leads with contact entity data - admin users see all data
      let leadsQuery = supabase
        .from('leads')
        .select(`
          *,
          contact_entity:contact_entities!contact_entity_id (*)
        `)
      
      // Only filter by user_id if not admin
      if (!hasRole('admin') && !hasRole('super_admin')) {
        leadsQuery = leadsQuery.eq('user_id', user.id)
      }
      
      const { data: leadsData } = await leadsQuery
        .order('created_at', { ascending: false })
        .limit(5)

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
             ['Application', 'Pre-approval'].includes(lead.stage)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground border-b-2 border-primary pb-2">Dashboard</h1>
          <p className="text-foreground">Welcome back! Here's your performance overview.</p>
          <p className="text-sm text-foreground mt-1">{formatDateTime(currentDateTime)}</p>
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
              <CardTitle className="text-sm font-medium text-foreground border-b border-primary/30 pb-1">
                {metric.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
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
              <CardTitle className="text-foreground border-b-2 border-primary pb-2">Sales Pipeline</CardTitle>
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
                    <span className="text-foreground font-medium dark:text-white">{stage.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground dark:text-white">{stage.count} leads</span>
                      <Target className="h-3 w-3 text-muted-foreground dark:text-white" />
                    </div>
                  </div>
                  <Progress value={stage.percentage} className="h-3 hover:h-4 transition-all" />
                  <div className="text-xs text-muted-foreground dark:text-white text-right">{stage.percentage}% completion</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <TodaysTasks />
      </div>

      {/* Loan Close Performance */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="dark:text-white border-b-2 border-primary pb-2">Loan Close Performance</CardTitle>
          <p className="text-sm text-muted-foreground dark:text-white">Monthly closed loans vs targets and close percentage</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
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
        </CardContent>
      </Card>

      {/* Recent Leads */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="dark:text-white border-b-2 border-primary pb-2">Recent Leads</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-white" />
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
                key={`lead-${index}-${lead.name}`}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border hover:shadow-medium transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => handleLeadClick(lead)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-foreground dark:text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground dark:text-white">{lead.name}</p>
                    <p className="text-sm text-muted-foreground dark:text-white">{lead.amount}</p>
                    <p className="text-xs text-muted-foreground dark:text-white">Program: {lead.loanType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{lead.stage}</Badge>
                  <span className="text-sm text-muted-foreground dark:text-white">{lead.lastContact}</span>
                  <Badge 
                    variant={lead.priority === 'high' ? 'destructive' : 
                            lead.priority === 'medium' ? 'default' : 'secondary'}
                  >
                    {lead.priority}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground dark:text-white" />
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
  )
}
