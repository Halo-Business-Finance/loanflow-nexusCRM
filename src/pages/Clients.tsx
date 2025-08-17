import { useState, useEffect } from "react"
import { mapClientFields, CLIENT_WITH_CONTACT_QUERY } from "@/lib/field-mapping"
import { Client } from "@/types/lead"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useNavigate } from "react-router-dom"
import { HorizontalNav } from "@/components/HorizontalNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Phone, Mail, MapPin, Calendar, DollarSign, Filter, ChevronDown, ChevronUp, Trash2, Bell, MessageSquare, ShoppingCart, FileText, Eye, Plus, Loader2, Users, CheckCircle2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ActionReminder } from "@/components/ActionReminder"
import { LoanManager } from "@/components/LoanManager"
import LoanRequestManager from "@/components/LoanRequestManager"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { useNotifications } from "@/hooks/useNotifications"
import { format } from "date-fns"

// Using imported Client interface from types/lead.ts

interface Loan {
  id: string
  loan_amount: number
  interest_rate?: number
  loan_term_months?: number
  maturity_date?: string
  loan_type: string
  status: string
  origination_date: string
  monthly_payment?: number
  remaining_balance?: number
  notes?: string
}

export default function ExistingBorrowers() {
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const { createNotification } = useNotifications()
  const [clients, setClients] = useState<Client[]>([])
  const [clientLoans, setClientLoans] = useState<{ [key: string]: Loan[] }>({})
  const [loans, setLoans] = useState<Loan[]>([])
  const [loanRequests, setLoanRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [showNotificationForm, setShowNotificationForm] = useState<string | null>(null)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>()
  const [selectedClientForReminder, setSelectedClientForReminder] = useState<Client | null>(null)
  
  // Add Client state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    business_name: "",
    business_address: "",
    status: "Active"
  })

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  const fetchClients = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select(CLIENT_WITH_CONTACT_QUERY)
        .order('created_at', { ascending: false })

      if (error) throw error

      const clientsWithContactData = (clientsData || []).map(mapClientFields)
      
      setClients(clientsWithContactData)
      
      // Fetch loans for all clients
      if (clientsData && clientsData.length > 0) {
        await fetchAllClientLoans(clientsData.map(c => c.id))
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllClientLoans = async (clientIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .in('client_id', clientIds)

      if (error) throw error

      // Group loans by client_id
      const loansByClient: { [key: string]: Loan[] } = {}
      data?.forEach(loan => {
        if (!loansByClient[loan.client_id]) {
          loansByClient[loan.client_id] = []
        }
        loansByClient[loan.client_id].push(loan)
      })

      setClientLoans(loansByClient)
    } catch (error) {
      console.error('Error fetching client loans:', error)
    }
  }

  const handleLoansUpdate = () => {
    fetchClients() // This will refetch both clients and loans
  }

  const deleteClient = async (clientId: string, clientName: string) => {
    try {
      // Delete all related records in the correct order to avoid foreign key constraints
      
      // Delete cases associated with this client
      const { error: casesError } = await supabase
        .from('cases')
        .delete()
        .eq('client_id', clientId)

      if (casesError) {
        console.error('Error deleting cases:', casesError)
        // Continue with deletion even if no cases exist
      }

      // Delete loans associated with this client
      const { error: loansError } = await supabase
        .from('loans')
        .delete()
        .eq('client_id', clientId)

      if (loansError) {
        console.error('Error deleting loans:', loansError)
        // Continue with deletion even if no loans exist
      }

      // Delete pipeline entries
      const { error: pipelineError } = await supabase
        .from('pipeline_entries')
        .delete()
        .eq('client_id', clientId)

      if (pipelineError) {
        console.error('Error deleting pipeline entries:', pipelineError)
        // Continue with deletion even if no pipeline entries exist
      }

      // Delete community members where this client is referenced
      const { error: communityMembersError } = await supabase
        .from('community_members')
        .delete()
        .eq('client_id', clientId)

      if (communityMembersError) {
        console.error('Error deleting community members:', communityMembersError)
        // Continue with deletion even if no community members exist
      }

      // Finally delete the client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (clientError) throw clientError

      toast({
        title: "Success!",
        description: `${clientName} and all associated data have been deleted successfully.`,
      })

      fetchClients() // Refresh the clients list
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const createCallReminder = async (clientId: string, clientName: string) => {
    if (!followUpDate) {
      toast({
        title: "Error",
        description: "Please select a follow-up date",
        variant: "destructive",
      })
      return
    }

    try {
      await createNotification({
        title: "Call Reminder",
        message: `Schedule a call with ${clientName} on ${format(followUpDate, 'PPP')}`,
        type: 'call_reminder',
        clientId: clientId,
      })

      setFollowUpDate(undefined)
      setShowNotificationForm(null)
      toast({
        title: "Success",
        description: "Call reminder created successfully",
      })
    } catch (error) {
      console.error('Error creating call reminder:', error)
      toast({
        title: "Error",
        description: "Failed to create call reminder",
        variant: "destructive",
      })
    }
  }

  const createEmailReminder = async (clientId: string, clientName: string) => {
    if (!followUpDate) {
      toast({
        title: "Error",
        description: "Please select a follow-up date",
        variant: "destructive",
      })
      return
    }

    try {
      await createNotification({
        title: "Email Reminder",
        message: `Send follow-up email to ${clientName} on ${format(followUpDate, 'PPP')}`,
        type: 'email_reminder',
        clientId: clientId,
      })

      setFollowUpDate(undefined)
      setShowNotificationForm(null)
      toast({
        title: "Success",
        description: "Email reminder created successfully",
      })
    } catch (error) {
      console.error('Error creating email reminder:', error)
      toast({
        title: "Error",
        description: "Failed to create email reminder",
        variant: "destructive",
      })
    }
  }

  const createFollowUpReminder = async (clientId: string, clientName: string) => {
    if (!followUpDate) {
      toast({
        title: "Error",
        description: "Please select a follow-up date",
        variant: "destructive",
      })
      return
    }

    try {
      await createNotification({
        title: "Follow-up Reminder",
        message: `Follow up with ${clientName} on ${format(followUpDate, 'PPP')}`,
        type: 'follow_up_reminder',
        clientId: clientId,
      })

      setFollowUpDate(undefined)
      setShowNotificationForm(null)
      toast({
        title: "Success",
        description: "Follow-up reminder created successfully",
      })
    } catch (error) {
      console.error('Error creating follow-up reminder:', error)
      toast({
        title: "Error",
        description: "Failed to create follow-up reminder",
        variant: "destructive",
      })
    }
  }

  const saveNotification = async (clientId: string, clientName: string) => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and message for the notification",
        variant: "destructive",
      })
      return
    }

    try {
      await createNotification({
        title: notificationTitle,
        message: notificationMessage,
        type: 'client_note',
        clientId: clientId,
      })

      setNotificationTitle("")
      setNotificationMessage("")
      setShowNotificationForm(null)
      toast({
        title: "Success",
        description: "Notification created successfully",
      })
    } catch (error) {
      console.error('Error creating notification:', error)
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      })
    }
  }

  const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      case 'inactive': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStageColor = (stage?: string) => {
    if (!stage) return 'secondary'
    switch (stage) {
      case 'Initial Contact': return 'secondary'
      case 'Qualified': return 'default'
      case 'Application': return 'default'
      case 'Pre-approval': return 'default'
      case 'Documentation': return 'default'
      case 'Closing': return 'default'
      case 'Funded': return 'default'
      default: return 'secondary'
    }
  }

  const totalLoanValue = clients.reduce((sum, client) => sum + (client.total_loan_value || 0), 0)
  const activeClients = clients.filter(c => c.status === 'Active').length
  const avgLoanSize = clients.length > 0 ? totalLoanValue / clients.length : 0

  const addNewClient = async () => {
    if (!newClient.name.trim() || !newClient.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and email are required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // First create contact entity
      const { data: contactEntity, error: contactError } = await supabase
        .from('contact_entities')
        .insert({
          user_id: user?.id,
          name: newClient.name.trim(),
          email: newClient.email.trim().toLowerCase(),
          phone: newClient.phone?.trim() || null,
          business_name: newClient.business_name?.trim() || null,
          business_address: newClient.business_address?.trim() || null,
          stage: 'Loan Funded' // Clients are already funded
        })
        .select()
        .single()

      if (contactError) throw contactError

      // Then create client record
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user?.id,
          contact_entity_id: contactEntity.id,
          status: newClient.status,
          total_loans: 0,
          total_loan_value: 0
        })

      if (clientError) throw clientError

      toast({
        title: "Success!",
        description: "New client has been added successfully.",
      })

      // Reset form and close dialog
      setNewClient({
        name: "",
        email: "",
        phone: "",
        business_name: "",
        business_address: "",
        status: "Active"
      })
      setShowAddDialog(false)
      fetchClients() // Refresh the clients list
    } catch (error) {
      console.error('Error adding client:', error)
      toast({
        title: "Error",
        description: `Failed to add new client: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HorizontalNav />
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNav />
      <div className="min-h-screen bg-background">
        {/* Modern Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-foreground">
                      Existing Borrowers
                    </h1>
                    <Badge variant="default" className="text-xs font-medium px-2 py-1">
                      {clients.length} Borrowers
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage and track your existing borrower relationships and portfolios
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                  <Filter className="h-3 w-3 mr-2" />
                  Filter
                </Button>
                <Button onClick={() => setShowAddDialog(true)} size="sm" className="h-8 text-xs font-medium">
                  <Plus className="h-3 w-3 mr-2" />
                  Add Borrower
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ... keep existing code (all the content sections) */}

        {/* Action Reminder Dialog */}
        {selectedClientForReminder && (
          <ActionReminder
            entityId={selectedClientForReminder.id}
            entityName={selectedClientForReminder.name}
            entityType="client"
            isOpen={!!selectedClientForReminder}
            onClose={() => setSelectedClientForReminder(null)}
          />
        )}
      </div>
    </div>
  )
}