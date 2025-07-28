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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Filter, Phone, Mail, User, MapPin, DollarSign, ArrowRight, Building } from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  business_name?: string
  loan_amount?: number
  loan_type?: string
  stage: string
  priority: string
  credit_score?: number
  income?: number
  last_contact: string
  is_converted_to_client: boolean
}

const stages = ["All", "Initial Contact", "Qualified", "Application", "Pre-approval", "Documentation", "Closing"]
const priorities = ["All", "High", "Medium", "Low"]
const loanTypes = ["SBA 7(a) Loan", "SBA 504 Loan", "Bridge Loan", "Conventional Loan", "Equipment Financing", "USDA B&I Loan", "Working Capital Loan", "Line of Credit", "Land Loan", "Factoring"]

// Phone number formatting function
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '')
  
  // Format based on length
  if (phoneNumber.length < 4) {
    return phoneNumber
  } else if (phoneNumber.length < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }
}

export default function Leads() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStage, setSelectedStage] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    business_name: "",
    loan_amount: "",
    loan_type: "SBA 7(a) Loan",
    credit_score: "",
    income: "",
    priority: "medium",
    stage: "Initial Contact",
    notes: ""
  })
  
  const [editLead, setEditLead] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    business_name: "",
    loan_amount: "",
    loan_type: "SBA 7(a) Loan",
    credit_score: "",
    income: "",
    priority: "medium",
    stage: "Initial Contact",
    notes: ""
  })

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
      
      // Map location field to address for consistency with the interface
      const mappedData = data?.map(lead => ({
        ...lead,
        address: lead.location
      })) || []
      
      setLeads(mappedData)
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
          address: lead.address,
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

  const addNewLead = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: user?.id,
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone || null,
          location: newLead.address || null, // Map address to location
          business_name: newLead.business_name || null,
          loan_amount: newLead.loan_amount ? parseFloat(newLead.loan_amount) : null,
          loan_type: newLead.loan_type || null,
          credit_score: newLead.credit_score ? parseInt(newLead.credit_score) : null,
          income: newLead.income ? parseFloat(newLead.income) : null,
          priority: newLead.priority,
          stage: newLead.stage,
          notes: newLead.notes || null
        })

      if (error) throw error

      toast({
        title: "Success!",
        description: "New lead has been added successfully.",
      })

      // Reset form and close dialog
      setNewLead({
        name: "",
        email: "",
        phone: "",
        address: "",
        business_name: "",
        loan_amount: "",
        loan_type: "SBA 7(a) Loan",
        credit_score: "",
        income: "",
        priority: "medium",
        stage: "Initial Contact",
        notes: ""
      })
      setShowAddDialog(false)
      fetchLeads() // Refresh the leads list
    } catch (error) {
      console.error('Error adding lead:', error)
      toast({
        title: "Error",
        description: "Failed to add new lead",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead)
    setEditLead({
      name: lead.name,
      email: lead.email,
      phone: formatPhoneNumber(lead.phone || ""),
      address: lead.address || "",
      business_name: lead.business_name || "",
      loan_amount: lead.loan_amount?.toString() || "",
      loan_type: lead.loan_type || "SBA 7(a) Loan",
      credit_score: lead.credit_score?.toString() || "",
      income: lead.income?.toString() || "",
      priority: lead.priority,
      stage: lead.stage,
      notes: "" // notes field not shown in current interface
    })
    setShowEditDialog(true)
  }

  const updateLead = async () => {
    if (!editingLead) return
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: editLead.name,
          email: editLead.email,
          phone: editLead.phone || null,
          location: editLead.address || null,
          business_name: editLead.business_name || null,
          loan_amount: editLead.loan_amount ? parseFloat(editLead.loan_amount) : null,
          loan_type: editLead.loan_type || null,
          credit_score: editLead.credit_score ? parseInt(editLead.credit_score) : null,
          income: editLead.income ? parseFloat(editLead.income) : null,
          priority: editLead.priority,
          stage: editLead.stage,
        })
        .eq('id', editingLead.id)

      if (error) throw error

      toast({
        title: "Success!",
        description: "Lead has been updated successfully.",
      })

      setShowEditDialog(false)
      setEditingLead(null)
      fetchLeads() // Refresh the leads list
    } catch (error) {
      console.error('Error updating lead:', error)
      toast({
        title: "Error",
        description: "Failed to update lead",
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
          <p className="text-white">Track and manage your loan prospects</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-medium">
              <Plus className="w-4 h-4 mr-2" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={newLead.business_name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Company or business name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      setNewLead(prev => ({ ...prev, phone: formatted }))
                    }}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
                 <div>
                   <Label htmlFor="address">Full Address</Label>
                   <Input
                     id="address"
                     value={newLead.address}
                     onChange={(e) => setNewLead(prev => ({ ...prev, address: e.target.value }))}
                     placeholder="123 Main St, City, State, ZIP"
                   />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loan_amount">Loan Amount</Label>
                  <Input
                    id="loan_amount"
                    type="number"
                    value={newLead.loan_amount}
                    onChange={(e) => setNewLead(prev => ({ ...prev, loan_amount: e.target.value }))}
                    placeholder="250000"
                  />
                </div>
                <div>
                  <Label htmlFor="loan_type">Loan Type</Label>
                  <Select value={newLead.loan_type} onValueChange={(value) => setNewLead(prev => ({ ...prev, loan_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credit_score">Credit Score</Label>
                  <Input
                    id="credit_score"
                    type="number"
                    value={newLead.credit_score}
                    onChange={(e) => setNewLead(prev => ({ ...prev, credit_score: e.target.value }))}
                    placeholder="750"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="income">Annual Income</Label>
                  <Input
                    id="income"
                    type="number"
                    value={newLead.income}
                    onChange={(e) => setNewLead(prev => ({ ...prev, income: e.target.value }))}
                    placeholder="75000"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newLead.priority} onValueChange={(value) => setNewLead(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select value={newLead.stage} onValueChange={(value) => setNewLead(prev => ({ ...prev, stage: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Application">Application</SelectItem>
                    <SelectItem value="Pre-approval">Pre-approval</SelectItem>
                    <SelectItem value="Documentation">Documentation</SelectItem>
                    <SelectItem value="Closing">Closing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newLead.notes}
                  onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this lead..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addNewLead}
                disabled={!newLead.name || !newLead.email}
              >
                Add Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
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
              <Card key={lead.id} className={`shadow-soft hover:shadow-medium transition-shadow cursor-pointer text-white ${lead.is_converted_to_client ? 'opacity-60' : ''}`} onClick={() => openEditDialog(lead)}>
                <CardHeader className="pb-3 text-white">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 !text-white">
                          {lead.name}
                          {lead.is_converted_to_client && (
                            <Badge variant="default" className="text-xs">Client</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-white">{new Date(lead.last_contact).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(lead.priority)}>
                      {lead.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-white">
                  <div className="space-y-2">
                    {lead.business_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-white" />
                        <span className="font-medium text-white">{lead.business_name}</span>
                      </div>
                    )}
                     <div className="flex items-center gap-2 text-sm">
                       <Mail className="w-4 h-4 text-white" />
                       <span className="text-white">{lead.email}</span>
                     </div>
                     {lead.phone && (
                       <div className="flex items-center gap-2 text-sm">
                         <Phone className="w-4 h-4 text-white" />
                         <span className="text-white">{formatPhoneNumber(lead.phone)}</span>
                       </div>
                     )}
                      {lead.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-white" />
                          <span className="text-white">{lead.address}</span>
                        </div>
                      )}
                    {lead.loan_amount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-white" />
                        <span className="font-medium text-white">${lead.loan_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {lead.loan_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs bg-muted px-2 py-1 rounded font-medium text-white">{lead.loan_type}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Badge variant={getStageColor(lead.stage)}>
                      {lead.stage}
                    </Badge>
                     {lead.credit_score && (
                       <div className="text-sm text-white">
                         Credit: {lead.credit_score}
                       </div>
                     )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </Button>
                    {!lead.is_converted_to_client && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="flex-1" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setConvertingLead(lead)
                            }}
                          >
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
                            <p className="text-sm text-white">
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
                      <th className="text-left p-4 font-medium text-white">Name</th>
                      <th className="text-left p-4 font-medium text-white">Contact</th>
                      <th className="text-left p-4 font-medium text-white">Loan Amount</th>
                      <th className="text-left p-4 font-medium text-white">Loan Type</th>
                      <th className="text-left p-4 font-medium text-white">Stage</th>
                      <th className="text-left p-4 font-medium text-white">Priority</th>
                      <th className="text-left p-4 font-medium text-white">Credit Score</th>
                      <th className="text-left p-4 font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className={`border-b hover:bg-muted/20 cursor-pointer ${lead.is_converted_to_client ? 'opacity-60' : ''}`} onClick={() => openEditDialog(lead)}>
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
                               {lead.business_name && (
                                 <div className="text-sm text-primary font-medium">{lead.business_name}</div>
                               )}
                               <div className="text-sm text-white">{lead.address}</div>
                             </div>
                          </div>
                        </td>
                        <td className="p-4">
                           <div className="text-sm">
                             <div className="text-white">{lead.email}</div>
                             <div className="text-white">{lead.phone ? formatPhoneNumber(lead.phone) : ''}</div>
                           </div>
                        </td>
                         <td className="p-4 font-medium text-white">
                           {lead.loan_amount ? `$${lead.loan_amount.toLocaleString()}` : '-'}
                         </td>
                        <td className="p-4">
                          <span className="text-xs bg-muted px-2 py-1 rounded font-medium text-white">{lead.loan_type || '-'}</span>
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
                        <td className="p-4 text-white">{lead.credit_score || '-'}</td>
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
                                    <p className="text-sm text-white">
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

      {/* Edit Lead Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editLead.name}
                  onChange={(e) => setEditLead(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label htmlFor="edit-business_name">Business Name</Label>
                <Input
                  id="edit-business_name"
                  value={editLead.business_name}
                  onChange={(e) => setEditLead(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Company or business name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editLead.email}
                onChange={(e) => setEditLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editLead.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value)
                    setEditLead(prev => ({ ...prev, phone: formatted }))
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
               <div>
                 <Label htmlFor="edit-address">Full Address</Label>
                 <Input
                   id="edit-address"
                   value={editLead.address}
                   onChange={(e) => setEditLead(prev => ({ ...prev, address: e.target.value }))}
                   placeholder="123 Main St, City, State, ZIP"
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-loan_amount">Loan Amount</Label>
                <Input
                  id="edit-loan_amount"
                  type="number"
                  value={editLead.loan_amount}
                  onChange={(e) => setEditLead(prev => ({ ...prev, loan_amount: e.target.value }))}
                  placeholder="250000"
                />
              </div>
              <div>
                <Label htmlFor="edit-loan_type">Loan Type</Label>
                <Select value={editLead.loan_type} onValueChange={(value) => setEditLead(prev => ({ ...prev, loan_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-credit_score">Credit Score</Label>
                <Input
                  id="edit-credit_score"
                  type="number"
                  value={editLead.credit_score}
                  onChange={(e) => setEditLead(prev => ({ ...prev, credit_score: e.target.value }))}
                  placeholder="750"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-income">Annual Income</Label>
                <Input
                  id="edit-income"
                  type="number"
                  value={editLead.income}
                  onChange={(e) => setEditLead(prev => ({ ...prev, income: e.target.value }))}
                  placeholder="75000"
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editLead.priority} onValueChange={(value) => setEditLead(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-stage">Stage</Label>
              <Select value={editLead.stage} onValueChange={(value) => setEditLead(prev => ({ ...prev, stage: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Application">Application</SelectItem>
                  <SelectItem value="Pre-approval">Pre-approval</SelectItem>
                  <SelectItem value="Documentation">Documentation</SelectItem>
                  <SelectItem value="Closing">Closing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateLead}
              disabled={!editLead.name || !editLead.email}
            >
              Update Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </Layout>
  )
}