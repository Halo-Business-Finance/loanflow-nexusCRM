import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Filter, Phone, Mail, User, MapPin, DollarSign, ArrowRight } from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  loan_amount?: number
  stage: string
  priority: string
  credit_score?: number
  income?: number
  last_contact: string
  is_converted_to_client: boolean
}

const stages = ["All", "Initial Contact", "Qualified", "Application", "Pre-approval", "Documentation", "Closing"]
const priorities = ["All", "High", "Medium", "Low"]

export default function Leads() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStage, setSelectedStage] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)

  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const convertToClient = async (lead: Lead) => {
    try {
      // Create client record
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user?.id,
          lead_id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          location: lead.location,
          status: 'Active',
          total_loans: 0,
          total_loan_value: 0
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Create pipeline entry for the new client
      const { error: pipelineError } = await supabase
        .from('pipeline_entries')
        .insert({
          user_id: user?.id,
          lead_id: lead.id,
          client_id: client.id,
          stage: lead.stage,
          amount: lead.loan_amount || 0,
          priority: lead.priority,
        })

      if (pipelineError) throw pipelineError

      // Mark lead as converted
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          is_converted_to_client: true,
          converted_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (updateError) throw updateError

      toast({
        title: "Success!",
        description: `${lead.name} has been converted to a client and added to the pipeline.`,
      })

      fetchLeads() // Refresh the leads list
      setConvertingLead(null)
    } catch (error) {
      console.error('Error converting lead:', error)
      toast({
        title: "Error",
        description: "Failed to convert lead to client",
        variant: "destructive",
      })
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStage = selectedStage === "All" || lead.stage === selectedStage
    const matchesPriority = selectedPriority === "All" || lead.priority.toLowerCase() === selectedPriority.toLowerCase()
    
    return matchesSearch && matchesStage && matchesPriority
  })

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Initial Contact': return 'secondary'
      case 'Qualified': return 'default'
      case 'Application': return 'default'
      case 'Pre-approval': return 'default'
      case 'Documentation': return 'default'
      case 'Closing': return 'default'
      default: return 'secondary'
    }
  }

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
          <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground">Track and manage your loan prospects</p>
        </div>
        <Button className="bg-gradient-primary shadow-medium">
          <Plus className="w-4 h-4 mr-2" />
          Add New Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search leads by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className={`shadow-soft hover:shadow-medium transition-shadow cursor-pointer ${lead.is_converted_to_client ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {lead.name}
                          {lead.is_converted_to_client && (
                            <Badge variant="default" className="text-xs">Client</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{new Date(lead.last_contact).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(lead.priority)}>
                      {lead.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{lead.email}</span>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{lead.phone}</span>
                      </div>
                    )}
                    {lead.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{lead.location}</span>
                      </div>
                    )}
                    {lead.loan_amount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">${lead.loan_amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Badge variant={getStageColor(lead.stage)}>
                      {lead.stage}
                    </Badge>
                    {lead.credit_score && (
                      <div className="text-sm text-muted-foreground">
                        Credit: {lead.credit_score}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </Button>
                    {!lead.is_converted_to_client && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="default" className="flex-1" onClick={() => setConvertingLead(lead)}>
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Convert
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Convert Lead to Client</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Are you sure you want to convert <strong>{lead.name}</strong> to a client?</p>
                            <p className="text-sm text-muted-foreground">
                              This will create a new client record and add them to your pipeline.
                            </p>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setConvertingLead(null)}>
                              Cancel
                            </Button>
                            <Button onClick={() => convertToClient(lead)}>
                              Convert to Client
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="table">
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Contact</th>
                      <th className="text-left p-4 font-medium">Loan Amount</th>
                      <th className="text-left p-4 font-medium">Stage</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">Credit Score</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className={`border-b hover:bg-muted/20 ${lead.is_converted_to_client ? 'opacity-60' : ''}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {lead.name}
                                {lead.is_converted_to_client && (
                                  <Badge variant="default" className="text-xs">Client</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{lead.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div>{lead.email}</div>
                            <div className="text-muted-foreground">{lead.phone}</div>
                          </div>
                        </td>
                        <td className="p-4 font-medium">
                          {lead.loan_amount ? `$${lead.loan_amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4">
                          <Badge variant={getStageColor(lead.stage)}>
                            {lead.stage}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={getPriorityColor(lead.priority)}>
                            {lead.priority}
                          </Badge>
                        </td>
                        <td className="p-4">{lead.credit_score || '-'}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="w-3 h-3" />
                            </Button>
                            {!lead.is_converted_to_client && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="default">
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Convert Lead to Client</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p>Are you sure you want to convert <strong>{lead.name}</strong> to a client?</p>
                                    <p className="text-sm text-muted-foreground">
                                      This will create a new client record and add them to your pipeline.
                                    </p>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline">Cancel</Button>
                                    <Button onClick={() => convertToClient(lead)}>
                                      Convert to Client
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  )
}