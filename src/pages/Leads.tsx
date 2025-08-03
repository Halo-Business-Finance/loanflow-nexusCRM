import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { secureStorage } from "@/lib/secure-storage"

// New modular components
import { LeadStats } from "@/components/leads/LeadStats"
import { LeadForm } from "@/components/leads/LeadForm"
import { LeadsList } from "@/components/leads/LeadsList"

import { formatPhoneNumber } from "@/lib/utils"
import { 
  Plus, 
  Grid3X3, 
  List, 
  Loader2,
  AlertTriangle
} from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// Import centralized types
import { Lead, ContactEntity, STAGES, PRIORITIES } from "@/types/lead"

export default function Leads() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStage, setSelectedStage] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  
  // Load view mode from secure storage
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedViewMode = await secureStorage.getItem('leads-view-mode');
        if (savedViewMode === 'grid' || savedViewMode === 'table') {
          setViewMode(savedViewMode);
        }
      } catch (error) {
        console.error("Error loading view mode:", error);
      }
    };
    loadViewMode();
  }, []);
  
  // Dialog states
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Function to handle view mode change with persistence
  const handleViewModeChange = async (mode: "grid" | "table") => {
    setViewMode(mode)
    await secureStorage.setItem('leads-view-mode', mode)
  }

  // Effects
  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user])

  // Refetch leads when component mounts or comes back into focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchLeads()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Also refetch when navigating back to this page
  useEffect(() => {
    if (user && document.visibilityState === 'visible') {
      fetchLeads()
    }
  }, [window.location.pathname, user])

  // Data fetching
  const fetchLeads = async () => {
    try {
      // All authenticated users can see all leads (universal access)
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          contact_entity:contact_entities(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Merge leads with contact entity data and filter out invalid leads
      const mergedLeads = (data || [])
        .filter(lead => lead.contact_entity && lead.contact_entity.name) // Filter out leads without valid contact entities
        .map(lead => ({
          ...lead,
          name: lead.contact_entity?.name || '',
          email: lead.contact_entity?.email || '',
          phone: lead.contact_entity?.phone || '',
          location: lead.contact_entity?.location || '',
          stage: lead.contact_entity?.stage || 'New',
          priority: lead.contact_entity?.priority || 'medium',
          loan_amount: lead.contact_entity?.loan_amount || 0,
          loan_type: lead.contact_entity?.loan_type || '',
          business_name: lead.contact_entity?.business_name || '',
          credit_score: lead.contact_entity?.credit_score || 0,
          net_operating_income: lead.contact_entity?.net_operating_income || 0,
          naics_code: lead.contact_entity?.naics_code || '',
          ownership_structure: lead.contact_entity?.ownership_structure || ''
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

  // Lead operations
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

  const addNewLead = async (contactData: ContactEntity) => {
    setIsSubmitting(true)
    try {
      // Validate required fields
      if (!contactData.name.trim() || !contactData.email.trim()) {
        toast({
          title: "Validation Error",
          description: "Name and email are required fields",
          variant: "destructive",
        })
        return
      }

      // First create contact entity
      const { data: contactEntity, error: contactError } = await supabase
        .from('contact_entities')
        .insert({
          user_id: user?.id,
          name: contactData.name.trim(),
          email: contactData.email.trim().toLowerCase(),
          phone: contactData.phone?.trim() || null,
          location: contactData.location?.trim() || null,
          business_name: contactData.business_name?.trim() || null,
          business_address: contactData.business_address?.trim() || null,
          annual_revenue: contactData.annual_revenue ? Math.max(0, contactData.annual_revenue) : null,
          loan_amount: contactData.loan_amount ? Math.max(0, contactData.loan_amount) : null,
          loan_type: contactData.loan_type?.trim() || null,
          credit_score: contactData.credit_score ? Math.max(300, Math.min(850, contactData.credit_score)) : null,
          net_operating_income: contactData.net_operating_income || null,
          priority: contactData.priority || 'medium',
          stage: contactData.stage || 'Initial Contact',
          notes: contactData.notes?.trim() || null,
          naics_code: contactData.naics_code?.trim() || null,
          ownership_structure: contactData.ownership_structure?.trim() || null
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

      if (error) throw error

      toast({
        title: "Success!",
        description: "New lead has been added successfully.",
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead)
    setShowEditDialog(true)
  }

  const updateLead = async (contactData: ContactEntity) => {
    if (!editingLead) return
    
    setIsSubmitting(true)
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Current authenticated user:', user)
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }
      
      // Update contact entity
      const { error } = await supabase
        .from('contact_entities')
        .update({
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone || null,
          location: contactData.location || null,
          business_name: contactData.business_name || null,
          business_address: contactData.business_address || null,
          annual_revenue: contactData.annual_revenue || null,
          loan_amount: contactData.loan_amount || null,
          loan_type: contactData.loan_type || null,
          credit_score: contactData.credit_score || null,
          net_operating_income: contactData.net_operating_income || null,
          priority: contactData.priority,
          stage: contactData.stage,
          notes: contactData.notes || null,
          naics_code: contactData.naics_code || null,
          ownership_structure: contactData.ownership_structure || null
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
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Contact data being updated:', contactData)
      console.error('Editing lead:', editingLead)
      
      toast({
        title: "Error",
        description: `Failed to update lead: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
        description: `${leadName} has been deleted.`,
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

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.business_name && lead.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStage = selectedStage === "All" || lead.stage === selectedStage
    const matchesPriority = selectedPriority === "All" || lead.priority === selectedPriority
    
    return matchesSearch && matchesStage && matchesPriority
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <ErrorBoundary>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
              <p className="text-muted-foreground">
                Manage and track your sales leads
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <LeadForm
                  onSubmit={addNewLead}
                  onCancel={() => setShowAddDialog(false)}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <LeadStats leads={leads} />

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={viewMode} onValueChange={handleViewModeChange}>
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid3X3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="table">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Leads List */}
          <LeadsList
            leads={filteredLeads}
            viewMode={viewMode}
            onEdit={openEditDialog}
            onDelete={deleteLead}
            onConvert={(lead) => setConvertingLead(lead)}
            onRefresh={fetchLeads}
            hasAdminRole={hasRole('admin') || hasRole('super_admin')}
          />

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
              </DialogHeader>
              <LeadForm
                lead={editingLead}
                onSubmit={updateLead}
                onCancel={() => {
                  setShowEditDialog(false)
                  setEditingLead(null)
                }}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>

          {/* Convert Confirmation Dialog */}
          <AlertDialog open={!!convertingLead} onOpenChange={() => setConvertingLead(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Convert Lead to Client</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to convert {convertingLead?.name} to a client? This will create a new client record and add them to your pipeline.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConvertingLead(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => convertingLead && convertToClient(convertingLead)}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Convert to Client
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </Layout>
    </ErrorBoundary>
  )
}