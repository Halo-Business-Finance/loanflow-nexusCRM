import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  Clock
} from "lucide-react"

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

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your performance overview.</p>
        </div>
        <Button className="bg-gradient-primary shadow-medium">
          New Lead
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-primary" />
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
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{stage.name}</span>
                    <span className="text-muted-foreground">{stage.count} leads</span>
                  </div>
                  <Progress value={stage.percentage} className="h-2" />
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
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {activity.type === 'call' && <Phone className="w-4 h-4 text-primary mt-0.5" />}
                  {activity.type === 'email' && <Mail className="w-4 h-4 text-primary mt-0.5" />}
                  {activity.type === 'meeting' && <Calendar className="w-4 h-4 text-primary mt-0.5" />}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLeads.map((lead, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}