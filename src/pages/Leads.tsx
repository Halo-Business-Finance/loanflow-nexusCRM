import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { LeadCard } from "@/components/LeadCard"
import { LeadTableRow } from "@/components/LeadTableRow"
import { LeadFilters } from "@/components/LeadFilters"
import { formatPhoneNumber } from "@/lib/utils"
import { 
  Plus, 
  Grid3X3, 
  List, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Loader2,
  ArrowRight,
  AlertTriangle
} from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Lead {
  id: string
  contact_entity_id: string
  user_id: string
  name: string
  email: string
  phone?: string
  location?: string
  business_name?: string
  naics_code?: string
  ownership_structure?: string
  loan_amount?: number
  loan_type?: string
  stage: string
  priority: string
  credit_score?: number
  net_operating_income?: number
  last_contact: string
  is_converted_to_client: boolean
}

const stages = ["All", "Initial Contact", "Qualified", "Application", "Pre-approval", "Documentation", "Closing", "Funded", "Archive"]
const priorities = ["All", "High", "Medium", "Low"]
const loanTypes = ["SBA 7(a) Loan", "SBA 504 Loan", "Bridge Loan", "Conventional Loan", "Equipment Financing", "USDA B&I Loan", "Working Capital Loan", "Line of Credit", "Land Loan", "Factoring"]

export default function Leads() {
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStage, setSelectedStage] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    business_name: "",
    loan_amount: "",
    loan_type: "SBA 7(a) Loan",
    credit_score: "",
    net_operating_income: "",
    priority: "medium",
    stage: "Initial Contact",
    notes: "",
    business_address: "",
    annual_revenue: "",
    existing_loan_amount: "",
    pos_system: "",
    monthly_processing_volume: "",
    average_transaction_size: "",
    processor_name: "",
    current_processing_rate: "",
    bdo_name: "",
    bdo_telephone: "",
    bdo_email: ""
  })
  
  const [editLead, setEditLead] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    business_name: "",
    loan_amount: "",
    loan_type: "SBA 7(a) Loan",
    credit_score: "",
    net_operating_income: "",
    priority: "medium",
    stage: "Initial Contact",
    notes: "",
    business_address: "",
    annual_revenue: "",
    existing_loan_amount: "",
    pos_system: "",
    monthly_processing_volume: "",
    average_transaction_size: "",
    processor_name: "",
    current_processing_rate: "",
    bdo_name: "",
    bdo_telephone: "",
    bdo_email: ""
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
        .select(`
          *,
          contact_entity:contact_entities(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Merge leads with contact entity data
      const mergedLeads = (data || []).map(lead => ({
        ...lead,
        name: lead.contact_entity?.name || '',
        email: lead.contact_entity?.email || '',
        phone: lead.contact_entity?.phone || '',
        location: lead.contact_entity?.location || '',
        stage: lead.contact_entity?.stage || 'New',
        priority: lead.contact_entity?.priority || 'medium',
        loan_amount: lead.contact_entity?.loan_amount || 0,
        business_name: lead.contact_entity?.business_name || ''
      }))
      
      setLeads(mergedLeads)
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
      // Create client record with reference to existing contact entity
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user?.id,
          lead_id: lead.id,
          contact_entity_id: lead.contact_entity_id,
          status: 'Active'
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
      // First create contact entity
      const { data: contactEntity, error: contactError } = await supabase
        .from('contact_entities')
        .insert({
          user_id: user?.id,
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone || null,
          location: newLead.location || null,
          business_name: newLead.business_name || null,
          business_address: newLead.business_address || null,
          annual_revenue: newLead.annual_revenue ? parseFloat(newLead.annual_revenue) : null,
          existing_loan_amount: newLead.existing_loan_amount ? parseFloat(newLead.existing_loan_amount) : null,
          loan_amount: newLead.loan_amount ? parseFloat(newLead.loan_amount) : null,
          loan_type: newLead.loan_type || null,
          credit_score: newLead.credit_score ? parseInt(newLead.credit_score) : null,
          net_operating_income: newLead.net_operating_income ? parseFloat(newLead.net_operating_income) : null,
          priority: newLead.priority,
          stage: newLead.stage,
          notes: newLead.notes || null,
          pos_system: newLead.pos_system || null,
          monthly_processing_volume: newLead.monthly_processing_volume ? parseFloat(newLead.monthly_processing_volume) : null,
          average_transaction_size: newLead.average_transaction_size ? parseFloat(newLead.average_transaction_size) : null,
          processor_name: newLead.processor_name || null,
          current_processing_rate: newLead.current_processing_rate ? parseFloat(newLead.current_processing_rate) : null
        })
        .select()
        .single()

      if (contactError) throw contactError

      // Then create lead record
      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: user?.id,
          contact_entity_id: contactEntity.id
        })

      toast({
        title: "Success!",
        description: "New lead has been added successfully.",
      })

      // Reset form and close dialog
      setNewLead({
        name: "",
        email: "",
        phone: "",
        location: "",
        business_name: "",
        loan_amount: "",
        loan_type: "SBA 7(a) Loan",
        credit_score: "",
        net_operating_income: "",
        priority: "medium",
        stage: "Initial Contact",
        notes: "",
        business_address: "",
        annual_revenue: "",
        existing_loan_amount: "",
        pos_system: "",
        monthly_processing_volume: "",
        average_transaction_size: "",
        processor_name: "",
        current_processing_rate: "",
        bdo_name: "",
        bdo_telephone: "",
        bdo_email: ""
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
      location: lead.location || "",
      business_name: lead.business_name || "",
      loan_amount: lead.loan_amount?.toString() || "",
      loan_type: lead.loan_type || "SBA 7(a) Loan",
      credit_score: lead.credit_score?.toString() || "",
      net_operating_income: lead.net_operating_income?.toString() || "",
      priority: lead.priority,
      stage: lead.stage,
      notes: "",
      business_address: "",
      annual_revenue: "",
      existing_loan_amount: "",
      pos_system: "",
      monthly_processing_volume: "",
      average_transaction_size: "",
      processor_name: "",
      current_processing_rate: "",
      bdo_name: "",
      bdo_telephone: "",
      bdo_email: ""
    })
    setShowEditDialog(true)
  }

  const updateLead = async () => {
    if (!editingLead) return
    
    try {
      // Update contact entity
      const { error } = await supabase
        .from('contact_entities')
        .update({
          name: editLead.name,
          email: editLead.email,
          phone: editLead.phone || null,
          location: editLead.location || null,
          business_name: editLead.business_name || null,
          loan_amount: editLead.loan_amount ? parseFloat(editLead.loan_amount) : null,
          loan_type: editLead.loan_type || null,
          credit_score: editLead.credit_score ? parseInt(editLead.credit_score) : null,
          net_operating_income: editLead.net_operating_income ? parseFloat(editLead.net_operating_income) : null,
          priority: editLead.priority,
          stage: editLead.stage,
        })
        .eq('id', editingLead.contact_entity_id)

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

  const deleteLead = async (leadId: string, leadName: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) throw error

      toast({
        title: "Success!",
        description: `${leadName} has been deleted successfully.`,
      })

      fetchLeads() // Refresh the leads list
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: "Error",
        description: "Failed to delete lead",
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

  // Calculate stats
  const totalLeads = leads.length
  const activeLeads = leads.filter(lead => !lead.is_converted_to_client).length
  const convertedLeads = leads.filter(lead => lead.is_converted_to_client).length
  const totalPipelineValue = leads
    .filter(lead => !lead.is_converted_to_client)
    .reduce((sum, lead) => sum + (lead.loan_amount || 0), 0)

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading leads...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Leads Management</h1>
              <p className="text-muted-foreground text-lg">Track and manage your loan prospects</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-primary hover:shadow-lg transition-all duration-200 hover:scale-105">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">Add New Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="md:col-span-2">
                        <Label htmlFor="location">Full Address</Label>
                        <Input
                          id="location"
                          value={newLead.location}
                          onChange={(e) => setNewLead(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="123 Main St, City, State, ZIP"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Loan Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Loan Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div>
                        <Label htmlFor="net_operating_income">Net Operating Income</Label>
                        <Input
                          id="net_operating_income"
                          type="number"
                          value={newLead.net_operating_income}
                          onChange={(e) => setNewLead(prev => ({ ...prev, net_operating_income: e.target.value }))}
                          placeholder="500000"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Lead Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Lead Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-6">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={addNewLead}
                    disabled={!newLead.name || !newLead.email}
                    className="bg-gradient-primary"
                  >
                    Add Lead
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                    <p className="text-3xl font-bold text-foreground">{totalLeads}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                    <p className="text-3xl font-bold text-green-600">{activeLeads}</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500/60" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Converted</p>
                    <p className="text-3xl font-bold text-blue-600">{convertedLeads}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Pipeline Value</p>
                    <p className="text-2xl font-bold text-yellow-600">${totalPipelineValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-muted/30">
          <CardContent className="p-6">
            <LeadFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedStage={selectedStage}
              setSelectedStage={setSelectedStage}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
              totalLeads={totalLeads}
              filteredCount={filteredLeads.length}
            />
          </CardContent>
        </Card>

        {/* View Toggle & Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">View:</span>
              <div className="flex items-center border border-muted/30 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4 mr-1 text-white" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4 mr-1 text-white" />
                  Table
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          {filteredLeads.length === 0 ? (
            <Card className="border-dashed border-2 border-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertTriangle className="h-12 w-12 text-white mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No leads found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm || selectedStage !== "All" || selectedPriority !== "All" 
                    ? "Try adjusting your filters to see more leads."
                    : "Get started by adding your first lead to begin tracking prospects."
                  }
                </p>
                {(!searchTerm && selectedStage === "All" && selectedPriority === "All") && (
                  <Button 
                    onClick={() => setShowAddDialog(true)} 
                    className="mt-4 bg-gradient-primary"
                  >
                    <Plus className="w-4 h-4 mr-2 text-white" />
                    Add Your First Lead
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-muted/30">
              <CardContent className="p-0">
                {viewMode === "grid" ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {filteredLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onEdit={openEditDialog}
                          onDelete={deleteLead}
                          onConvert={convertToClient}
                          hasAdminRole={hasRole('admin')}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-muted/30 bg-muted/20">
                          <th className="text-left p-4 font-semibold text-foreground">Lead</th>
                          <th className="text-left p-4 font-semibold text-foreground">Contact</th>
                          <th className="text-right p-4 font-semibold text-foreground">Loan Amount</th>
                          <th className="text-left p-4 font-semibold text-foreground">Type</th>
                          <th className="text-left p-4 font-semibold text-foreground">Stage</th>
                          <th className="text-left p-4 font-semibold text-foreground">Priority</th>
                          <th className="text-center p-4 font-semibold text-foreground">Credit</th>
                          <th className="text-center p-4 font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((lead) => (
                          <LeadTableRow
                            key={lead.id}
                            lead={lead}
                            onEdit={openEditDialog}
                            onDelete={deleteLead}
                            onConvert={convertToClient}
                            hasAdminRole={hasRole('admin')}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Lead Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-location">Full Address</Label>
                    <Input
                      id="edit-location"
                      value={editLead.location}
                      onChange={(e) => setEditLead(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Loan Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Loan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="edit-net_operating_income">Net Operating Income</Label>
                    <Input
                      id="edit-net_operating_income"
                      type="number"
                      value={editLead.net_operating_income}
                      onChange={(e) => setEditLead(prev => ({ ...prev, net_operating_income: e.target.value }))}
                      placeholder="500000"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lead Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Lead Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateLead}
                disabled={!editLead.name || !editLead.email}
                className="bg-gradient-primary"
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