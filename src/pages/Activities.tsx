import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Phone, Mail, Calendar, FileText, DollarSign, Clock, User } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "Call",
    title: "Follow-up call with Sarah Johnson",
    description: "Discussed loan terms and answered questions about the application process",
    customer: "Sarah Johnson",
    officer: "Mike Smith",
    timestamp: "2 hours ago",
    status: "Completed",
    outcome: "Positive"
  },
  {
    id: 2,
    type: "Email",
    title: "Sent pre-approval letter to Michael Chen",
    description: "Pre-approval letter for $320,000 refinance loan sent to customer",
    customer: "Michael Chen",
    officer: "Sarah Davis",
    timestamp: "4 hours ago",
    status: "Completed",
    outcome: "Sent"
  },
  {
    id: 3,
    type: "Meeting",
    title: "Document review meeting with Emily Rodriguez",
    description: "Scheduled meeting to review missing documentation for loan application",
    customer: "Emily Rodriguez",
    officer: "John Wilson",
    timestamp: "1 day ago",
    status: "Scheduled",
    outcome: "Pending"
  },
  {
    id: 4,
    type: "Document",
    title: "Income verification received from David Thompson",
    description: "Latest pay stubs and tax returns uploaded to application",
    customer: "David Thompson",
    officer: "Lisa Chen",
    timestamp: "2 days ago",
    status: "Completed",
    outcome: "Received"
  },
  {
    id: 5,
    type: "Call",
    title: "Rate quote call with Anna Lee",
    description: "Provided current interest rates and loan options",
    customer: "Anna Lee",
    officer: "Mike Smith",
    timestamp: "3 days ago",
    status: "Completed",
    outcome: "Interested"
  },
  {
    id: 6,
    type: "Email",
    title: "Application status update to James Wilson",
    description: "Notified customer about application moving to underwriting stage",
    customer: "James Wilson",
    officer: "Sarah Davis",
    timestamp: "3 days ago",
    status: "Completed",
    outcome: "Acknowledged"
  }
]

export default function Activities() {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call': return Phone
      case 'email': return Mail
      case 'meeting': return Calendar
      case 'document': return FileText
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default'
      case 'scheduled': return 'secondary'
      case 'pending': return 'destructive'
      default: return 'secondary'
    }
  }

  const activityStats = {
    today: activities.filter(a => a.timestamp.includes('hour')).length,
    thisWeek: activities.filter(a => a.timestamp.includes('day') || a.timestamp.includes('hour')).length,
    calls: activities.filter(a => a.type === 'Call').length,
    emails: activities.filter(a => a.type === 'Email').length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activities</h1>
            <p className="text-muted-foreground">Track all customer interactions and communications</p>
          </div>
          <Button className="bg-gradient-primary">
            Log Activity
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.today}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.thisWeek}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activityStats.calls}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activityStats.emails}</div>
            </CardContent>
          </Card>
        </div>

        {/* Activities Timeline */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {activities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex gap-4">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      {index < activities.length - 1 && (
                        <div className="h-6 w-px bg-border mt-2" />
                      )}
                    </div>

                    {/* Activity content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-foreground">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={getStatusColor(activity.status)} className="text-xs">
                            {activity.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium">{activity.customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {activity.officer.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">Officer:</span>
                          <span className="font-medium">{activity.officer}</span>
                        </div>
                        {activity.outcome && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Outcome:</span>
                            <span className="font-medium text-accent">{activity.outcome}</span>
                          </div>
                        )}
                      </div>

                      {index < activities.length - 1 && (
                        <div className="border-b pt-3" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}