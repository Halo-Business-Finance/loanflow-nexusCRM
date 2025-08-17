import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserPlus, RotateCcw } from "lucide-react"

export default function LeadAssignment() {
  const unassignedLeads = [
    { id: 1, name: "John Smith", email: "john@example.com", source: "Website", priority: "High" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", source: "Referral", priority: "Medium" },
    { id: 3, name: "Mike Davis", email: "mike@example.com", source: "Social Media", priority: "Low" },
  ]

  const agents = [
    { id: 1, name: "Alex Rodriguez", avatar: "", leadCount: 12 },
    { id: 2, name: "Emma Thompson", avatar: "", leadCount: 8 },
    { id: 3, name: "James Wilson", avatar: "", leadCount: 15 },
    { id: 4, name: "Lisa Chen", avatar: "", leadCount: 6 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Assignment</h1>
        <p className="text-muted-foreground">
          Assign leads to team members for optimal distribution
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unassigned Leads
            </CardTitle>
            <CardDescription>
              Leads waiting to be assigned to team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {unassignedLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-muted-foreground">{lead.email}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{lead.source}</Badge>
                    <Badge 
                      variant={lead.priority === 'High' ? 'destructive' : 
                              lead.priority === 'Medium' ? 'default' : 'secondary'}
                    >
                      {lead.priority}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Workload
            </CardTitle>
            <CardDescription>
              Current lead distribution among team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback>
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {agent.leadCount} active leads
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{agent.leadCount}</Badge>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Rules</CardTitle>
          <CardDescription>
            Configure automatic lead assignment rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Assignment</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Round Robin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="least-busy">Least Busy</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">High Priority Leads</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to senior agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="senior">Senior Agents</SelectItem>
                  <SelectItem value="available">Next Available</SelectItem>
                  <SelectItem value="specific">Specific Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Leads per Agent</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="20" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button>Save Assignment Rules</Button>
        </CardContent>
      </Card>
    </div>
  )
}