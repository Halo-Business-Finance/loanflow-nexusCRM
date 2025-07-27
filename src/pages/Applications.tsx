import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Search, Filter, FileText, Calendar, User, DollarSign, Clock } from "lucide-react"

const applications = [
  {
    id: "APP-001",
    customerName: "Sarah Johnson",
    loanAmount: "$450,000",
    loanType: "Home Purchase",
    status: "In Review",
    progress: 65,
    submittedDate: "2024-01-15",
    lastUpdate: "2 hours ago",
    officer: "Mike Smith",
    priority: "High"
  },
  {
    id: "APP-002",
    customerName: "Michael Chen",
    loanAmount: "$320,000",
    loanType: "Refinance",
    status: "Pre-approved",
    progress: 85,
    submittedDate: "2024-01-12",
    lastUpdate: "1 day ago",
    officer: "Sarah Davis",
    priority: "Medium"
  },
  {
    id: "APP-003",
    customerName: "Emily Rodriguez",
    loanAmount: "$275,000",
    loanType: "Home Purchase",
    status: "Documentation",
    progress: 40,
    submittedDate: "2024-01-18",
    lastUpdate: "4 hours ago",
    officer: "John Wilson",
    priority: "Low"
  },
  {
    id: "APP-004",
    customerName: "David Thompson",
    loanAmount: "$680,000",
    loanType: "Jumbo Loan",
    status: "Underwriting",
    progress: 75,
    submittedDate: "2024-01-10",
    lastUpdate: "6 hours ago",
    officer: "Lisa Chen",
    priority: "High"
  },
  {
    id: "APP-005",
    customerName: "Anna Lee",
    loanAmount: "$390,000",
    loanType: "Home Purchase",
    status: "Approved",
    progress: 100,
    submittedDate: "2024-01-08",
    lastUpdate: "3 days ago",
    officer: "Mike Smith",
    priority: "Medium"
  }
]

export default function Applications() {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default'
      case 'pre-approved': return 'default'
      case 'in review': return 'secondary'
      case 'underwriting': return 'secondary'
      case 'documentation': return 'destructive'
      default: return 'secondary'
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

  const statusCounts = {
    total: applications.length,
    inReview: applications.filter(app => app.status === 'In Review').length,
    approved: applications.filter(app => app.status === 'Approved' || app.status === 'Pre-approved').length,
    documentation: applications.filter(app => app.status === 'Documentation').length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loan Applications</h1>
            <p className="text-muted-foreground">Track and manage loan applications</p>
          </div>
          <Button className="bg-gradient-primary">
            New Application
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
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

        {/* Application Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{statusCounts.inReview}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Need Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statusCounts.documentation}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{application.id}</h3>
                        <Badge variant={getPriorityColor(application.priority)} className="text-xs">
                          {application.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{application.customerName}</p>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <Badge variant={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Updated: {application.lastUpdate}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Application Progress</span>
                      <span className="text-sm text-muted-foreground">{application.progress}%</span>
                    </div>
                    <Progress value={application.progress} className="h-2" />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <div>
                        <div className="text-sm text-muted-foreground">Loan Amount</div>
                        <div className="font-medium">{application.loanAmount}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Loan Type</div>
                        <div className="font-medium">{application.loanType}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Submitted</div>
                        <div className="font-medium">{application.submittedDate}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Loan Officer</div>
                        <div className="font-medium">{application.officer}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Documents
                    </Button>
                    <Button size="sm" className="flex-1">
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}