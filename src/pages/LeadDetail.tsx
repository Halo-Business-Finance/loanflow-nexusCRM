import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { useNotifications } from "@/hooks/useNotifications"
import { format } from "date-fns"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Building, 
  CreditCard, 
  Save,
  Edit,
  Phone as PhoneIcon,
  Calendar,
  UserCheck,
  Home,
  CheckCircle,
  XCircle,
  Target,
  FileText,
  Bell,
  Trash2,
  ChevronDown
} from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  business_name?: string
  business_address?: string
  owns_property?: boolean
  property_payment_amount?: number
  year_established?: number
  loan_amount?: number
  loan_type?: string
  stage: string
  priority: string
  credit_score?: number
  net_operating_income?: number
  bank_lender_name?: string
  annual_revenue?: number
  interest_rate?: number
  maturity_date?: string
  existing_loan_amount?: number
  notes?: string
  call_notes?: string
  last_contact: string
  created_at: string
  income?: number
  is_converted_to_client: boolean
  bdo_name?: string
  bdo_telephone?: string
  bdo_email?: string
}

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  status: string
  total_loans: number
  total_loan_value: number
  join_date: string
  business_name?: string
  business_address?: string
  owns_property?: boolean
  property_payment_amount?: number
  year_established?: number
  credit_score?: number
  net_operating_income?: number
  bank_lender_name?: string
  annual_revenue?: number
  existing_loan_amount?: number
  notes?: string
  call_notes?: string
  priority?: string
  income?: number
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { createNotification } = useNotifications()
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [callNotes, setCallNotes] = useState("")
  const [newCallNote, setNewCallNote] = useState("")
  const [generalNotes, setGeneralNotes] = useState("")
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>()
  const [editableFields, setEditableFields] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    business_name: "",
    business_address: "",
    owns_property: false,
    property_payment_amount: "",
    year_established: "",
    loan_amount: "",
    loan_type: "",
    stage: "",
    priority: "",
    credit_score: "",
    net_operating_income: "",
    bank_lender_name: "",
    annual_revenue: "",
    interest_rate: "",
    maturity_date: "",
    existing_loan_amount: "",
    bdo_name: "",
    bdo_telephone: "",
    bdo_email: ""
  })

  useEffect(() => {
    if (id && user) {
      fetchLead()
    }
  }, [id, user])

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setLead(data)
      setCallNotes(data.call_notes || "")
      setGeneralNotes(data.notes || "")
      
      // Set editable fields for edit mode
      setEditableFields({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        business_name: data.business_name || "",
        business_address: data.business_address || "",
        owns_property: data.owns_property || false,
        property_payment_amount: (data as any).property_payment_amount?.toString() || "",
        year_established: (data as any).year_established?.toString() || "",
        loan_amount: data.loan_amount?.toString() || "",
        loan_type: data.loan_type || "",
        stage: data.stage || "",
        priority: data.priority || "",
        credit_score: data.credit_score?.toString() || "",
        net_operating_income: (data as any).net_operating_income?.toString() || "",
        bank_lender_name: (data as any).bank_lender_name || "",
        annual_revenue: data.annual_revenue?.toString() || "",
        interest_rate: data.interest_rate?.toString() || "",
        maturity_date: data.maturity_date || "",
        existing_loan_amount: data.existing_loan_amount?.toString() || "",
        bdo_name: (data as any).bdo_name || "",
        bdo_telephone: (data as any).bdo_telephone || "",
        bdo_email: (data as any).bdo_email || ""
      })
      
      // If lead is converted, fetch client data
      if (data.is_converted_to_client) {
        await fetchClientData(data.id)
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      toast({
        title: "Error",
        description: "Failed to fetch lead details",
        variant: "destructive",
      })
      navigate('/leads')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientData = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('lead_id', leadId)
        .single()

      if (error) {
        console.error('Error fetching client data:', error)
        return
      }
      
      setClient(data)
    } catch (error) {
      console.error('Error fetching client:', error)
    }
  }

  const saveCallNotes = async () => {
    if (!lead) return

    try {
      const updatedNotes = callNotes + (newCallNote ? `\n\n[${new Date().toLocaleString()}] ${newCallNote}` : "")
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          call_notes: updatedNotes,
          last_contact: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error

      setCallNotes(updatedNotes)
      setNewCallNote("")
      toast({
        title: "Success",
        description: "Call notes saved successfully",
      })
      
      // Refresh lead data
      fetchLead()
    } catch (error) {
      console.error('Error saving call notes:', error)
      toast({
        title: "Error",
        description: "Failed to save call notes",
        variant: "destructive",
      })
    }
  }

  const saveGeneralNotes = async () => {
    if (!lead) return

    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: generalNotes })
        .eq('id', lead.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "General notes saved successfully",
      })
      
      // Refresh lead data
      fetchLead()
    } catch (error) {
      console.error('Error saving general notes:', error)
      toast({
        title: "Error",
        description: "Failed to save general notes",
        variant: "destructive",
      })
    }
  }

  const createCallReminder = async () => {
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
        message: `Schedule a call with ${lead?.name || client?.name} on ${format(followUpDate, 'PPP')}`,
        type: 'call_reminder',
        leadId: lead?.id,
        clientId: client?.id,
      })

      setFollowUpDate(undefined)
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

  const createEmailReminder = async () => {
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
        message: `Send follow-up email to ${lead?.name || client?.name} on ${format(followUpDate, 'PPP')}`,
        type: 'email_reminder',
        leadId: lead?.id,
        clientId: client?.id,
      })

      setFollowUpDate(undefined)
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

  const createFollowUpReminder = async () => {
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
        message: `Follow up with ${lead?.name || client?.name} on ${format(followUpDate, 'PPP')}`,
        type: 'follow_up_reminder',
        leadId: lead?.id,
        clientId: client?.id,
      })

      setFollowUpDate(undefined)
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

  const saveNotification = async () => {
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
        type: lead ? 'lead_note' : 'client_note',
        leadId: lead?.id,
        clientId: client?.id,
      })

      setNotificationTitle("")
      setNotificationMessage("")
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

  const saveLeadChanges = async () => {
    if (!lead) return

    try {
      const updateData: any = {
        name: editableFields.name,
        email: editableFields.email,
        phone: editableFields.phone || null,
        location: editableFields.location || null,
        business_name: editableFields.business_name || null,
        business_address: editableFields.business_address || null,
        owns_property: editableFields.owns_property,
        property_payment_amount: editableFields.property_payment_amount ? parseFloat(editableFields.property_payment_amount) : null,
        year_established: editableFields.year_established ? parseInt(editableFields.year_established) : null,
        loan_amount: editableFields.loan_amount ? parseFloat(editableFields.loan_amount) : null,
        loan_type: editableFields.loan_type || null,
        stage: editableFields.stage,
        priority: editableFields.priority,
        credit_score: editableFields.credit_score ? parseInt(editableFields.credit_score) : null,
        net_operating_income: editableFields.net_operating_income ? parseFloat(editableFields.net_operating_income) : null,
        bank_lender_name: editableFields.bank_lender_name || null,
        annual_revenue: editableFields.annual_revenue ? parseFloat(editableFields.annual_revenue) : null,
        interest_rate: editableFields.interest_rate ? parseFloat(editableFields.interest_rate) : null,
        maturity_date: editableFields.maturity_date || null,
        existing_loan_amount: editableFields.existing_loan_amount ? parseFloat(editableFields.existing_loan_amount) : null,
        bdo_name: editableFields.bdo_name || null,
        bdo_telephone: editableFields.bdo_telephone || null,
        bdo_email: editableFields.bdo_email || null
      }

      // Check if stage is being changed to "Funded" and lead isn't already converted
      const isBeingFunded = editableFields.stage === "Funded" && lead.stage !== "Funded" && !lead.is_converted_to_client

      if (isBeingFunded) {
        // Mark lead as converted
        updateData.is_converted_to_client = true
        updateData.converted_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id)

      if (error) throw error

      // If being funded, create client record
      if (isBeingFunded) {
        await convertLeadToClient()
      }

      toast({
        title: "Success",
        description: isBeingFunded 
          ? "Lead updated and converted to client successfully" 
          : "Lead information updated successfully",
      })
      
      setIsEditing(false)
      // Refresh lead data
      fetchLead()
    } catch (error) {
      console.error('Error updating lead:', error)
      toast({
        title: "Error",
        description: "Failed to update lead information",
        variant: "destructive",
      })
    }
  }

  const convertLeadToClient = async () => {
    if (!lead || !user) return

    try {
      const clientData = {
        name: editableFields.name,
        email: editableFields.email,
        phone: editableFields.phone || null,
        location: editableFields.location || null,
        status: 'Active',
        user_id: user.id,
        lead_id: lead.id,
        join_date: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        // Transfer all business and financial information from lead
        business_name: editableFields.business_name || null,
        business_address: editableFields.business_address || null,
        owns_property: editableFields.owns_property || false,
        property_payment_amount: editableFields.property_payment_amount ? parseFloat(editableFields.property_payment_amount) : null,
        year_established: editableFields.year_established ? parseInt(editableFields.year_established) : null,
        credit_score: editableFields.credit_score ? parseInt(editableFields.credit_score) : null,
        net_operating_income: editableFields.net_operating_income ? parseFloat(editableFields.net_operating_income) : null,
        bank_lender_name: editableFields.bank_lender_name || null,
        annual_revenue: editableFields.annual_revenue ? parseFloat(editableFields.annual_revenue) : null,
        existing_loan_amount: editableFields.existing_loan_amount ? parseFloat(editableFields.existing_loan_amount) : null,
        notes: generalNotes || lead.notes || null,
        call_notes: callNotes || lead.call_notes || null,
        priority: editableFields.priority || 'medium',
        income: lead.income || null
      }

      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (clientError) throw clientError

      // Create a loan record if loan amount is specified
      if (editableFields.loan_amount && parseFloat(editableFields.loan_amount) > 0) {
        const loanData = {
          client_id: newClient.id,
          lead_id: lead.id,
          user_id: user.id,
          loan_amount: parseFloat(editableFields.loan_amount),
          loan_type: editableFields.loan_type || 'Mortgage',
          interest_rate: editableFields.interest_rate ? parseFloat(editableFields.interest_rate) : null,
          maturity_date: editableFields.maturity_date || null,
          status: 'Active',
          remaining_balance: parseFloat(editableFields.loan_amount)
        }

        const { error: loanError } = await supabase
          .from('loans')
          .insert(loanData)

        if (loanError) {
          console.error('Error creating loan:', loanError)
          // Don't throw error here as client was already created successfully
        }
      }

      setClient(newClient)
      
      console.log('Lead successfully converted to client:', newClient)
    } catch (error) {
      console.error('Error converting lead to client:', error)
      toast({
        title: "Warning", 
        description: "Lead updated but there was an issue creating the client record",
        variant: "destructive",
      })
    }
  }

  const deleteLead = async () => {
    if (!lead) return

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

      if (error) throw error

      toast({
        title: "Success!",
        description: `${lead.name} has been deleted successfully.`,
      })

      // Navigate back to leads page
      navigate('/leads')
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      })
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

  if (!lead) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'white' }}>Lead Not Found</h1>
          <Button onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/leads')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'white' }}>{lead.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={getPriorityColor(lead.priority)}>
                  {lead.priority} Priority
                </Badge>
                <Badge variant={getStageColor(lead.stage)}>
                  {lead.stage}
                </Badge>
                {lead.is_converted_to_client && (
                  <Badge variant="default">Client</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(!isEditing)}>
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            {isEditing && (
              <Button onClick={saveLeadChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Lead
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{lead.name}</strong>? This action cannot be undone and you will be redirected back to the leads page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteLead}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Lead
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'white' }}>
                <User className="w-5 h-5" />
                Lead Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" style={{ color: 'white' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'white' }}>Full Name</p>
                    {isEditing ? (
                      <Input
                        value={editableFields.name}
                        onChange={(e) => setEditableFields({...editableFields, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className="font-medium" style={{ color: 'white' }}>{lead.name}</p>
                    )}
                  </div>
                </div>


                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" style={{ color: 'white' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'white' }}>Email</p>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editableFields.email}
                        onChange={(e) => setEditableFields({...editableFields, email: e.target.value})}
                        placeholder="Enter email"
                      />
                    ) : (
                      <EmailComposer 
                        trigger={
                          <button className="font-medium hover:text-primary transition-colors text-left" style={{ color: 'white' }}>
                            {lead.email}
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4" style={{ color: 'white' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'white' }}>Phone</p>
                    {isEditing ? (
                      <Input
                        value={editableFields.phone}
                        onChange={(e) => setEditableFields({...editableFields, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      lead.phone ? (
                        <PhoneDialer 
                          trigger={
                            <button className="font-medium hover:text-primary transition-colors text-left" style={{ color: 'white' }}>
                              {lead.phone}
                            </button>
                          }
                        />
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>N/A</p>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" style={{ color: 'white' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'white' }}>Address</p>
                    {isEditing ? (
                      <Input
                        value={editableFields.location}
                        onChange={(e) => setEditableFields({...editableFields, location: e.target.value})}
                        placeholder="Enter address"
                      />
                    ) : (
                      <p className="font-medium" style={{ color: 'white' }}>{lead.location || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Stage</p>
                      {isEditing ? (
                        <Select value={editableFields.stage} onValueChange={(value) => setEditableFields({...editableFields, stage: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Application">Application</SelectItem>
                            <SelectItem value="Pre-approval">Pre-approval</SelectItem>
                            <SelectItem value="Documentation">Documentation</SelectItem>
                            <SelectItem value="Closing">Closing</SelectItem>
                            <SelectItem value="Funded">Funded</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getStageColor(lead.stage)}>{lead.stage}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Priority</p>
                      {isEditing ? (
                        <Select value={editableFields.priority} onValueChange={(value) => setEditableFields({...editableFields, priority: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getPriorityColor(lead.priority)}>{lead.priority} Priority</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4" style={{ color: 'white' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'white' }}>Credit Score</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editableFields.credit_score}
                        onChange={(e) => setEditableFields({...editableFields, credit_score: e.target.value})}
                        placeholder="Enter credit score"
                        min="300"
                        max="850"
                      />
                    ) : (
                      <p className="font-medium" style={{ color: 'white' }}>{formatNumber(lead.credit_score)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Last Contact</p>
                    <p className="font-medium" style={{ color: 'white' }}>
                      {new Date(lead.last_contact).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'white' }}>
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Business Name</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.business_name}
                          onChange={(e) => setEditableFields({...editableFields, business_name: e.target.value})}
                          placeholder="Enter business name"
                        />
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>{lead.business_name || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Business Address</p>
                      {isEditing ? (
                        <Textarea
                          value={editableFields.business_address}
                          onChange={(e) => setEditableFields({...editableFields, business_address: e.target.value})}
                          placeholder="Enter business address"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>{lead.business_address || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Year Established</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.year_established}
                          onChange={(e) => setEditableFields({...editableFields, year_established: e.target.value})}
                          placeholder="Enter year established (e.g., 2010)"
                          min="1800"
                          max={new Date().getFullYear()}
                        />
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>
                          {(lead as any).year_established || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Annual Revenue</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.annual_revenue}
                          onChange={(e) => setEditableFields({...editableFields, annual_revenue: e.target.value})}
                          placeholder="Enter annual revenue"
                        />
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>
                          {formatCurrency(lead.annual_revenue)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Property Ownership</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Switch
                            checked={editableFields.owns_property}
                            onCheckedChange={(checked) => setEditableFields({...editableFields, owns_property: checked})}
                          />
                          <span className="text-sm" style={{ color: 'white' }}>
                            {editableFields.owns_property ? 'Owns Property' : 'Does not own property'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {lead.owns_property ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <p className="font-medium" style={{ color: 'white' }}>
                            {lead.owns_property ? 'Owns Property' : 'Does not own property'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conditional property-related fields */}
                {(lead.owns_property || editableFields.owns_property) && (
                  <div className="col-span-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200/10">
                      {/* Property Fields Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                          <div className="flex-1">
                            <p className="text-sm" style={{ color: 'white' }}>Property Payment Amount</p>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editableFields.property_payment_amount}
                                onChange={(e) => setEditableFields({...editableFields, property_payment_amount: e.target.value})}
                                placeholder="Enter monthly/yearly payment amount"
                              />
                            ) : (
                              <p className="font-medium" style={{ color: 'white' }}>
                                {(lead as any).property_payment_amount ? formatCurrency((lead as any).property_payment_amount) : 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4" style={{ color: 'white' }} />
                          <div className="flex-1">
                            <p className="text-sm" style={{ color: 'white' }}>Interest Rate (%)</p>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editableFields.interest_rate}
                                onChange={(e) => setEditableFields({...editableFields, interest_rate: e.target.value})}
                                placeholder="Enter interest rate"
                              />
                            ) : (
                              <p className="font-medium" style={{ color: 'white' }}>
                                {lead.interest_rate ? `${lead.interest_rate}%` : 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Property Fields Right Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4" style={{ color: 'white' }} />
                          <div className="flex-1">
                            <p className="text-sm" style={{ color: 'white' }}>Loan Maturity Date</p>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editableFields.maturity_date}
                                onChange={(e) => setEditableFields({...editableFields, maturity_date: e.target.value})}
                              />
                            ) : (
                              <p className="font-medium" style={{ color: 'white' }}>
                                {lead.maturity_date ? new Date(lead.maturity_date).toLocaleDateString() : 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                          <div className="flex-1">
                            <p className="text-sm" style={{ color: 'white' }}>Existing Loan Amount</p>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editableFields.existing_loan_amount}
                                onChange={(e) => setEditableFields({...editableFields, existing_loan_amount: e.target.value})}
                                placeholder="Enter existing loan amount"
                              />
                            ) : (
                              <p className="font-medium" style={{ color: 'white' }}>
                                {lead.existing_loan_amount ? formatCurrency(lead.existing_loan_amount) : 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'white' }}>Annual Revenue</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editableFields.annual_revenue}
                      onChange={(e) => setEditableFields({...editableFields, annual_revenue: e.target.value})}
                      placeholder="Enter annual revenue"
                    />
                  ) : (
                    <p className="font-medium" style={{ color: 'white' }}>
                      {formatCurrency(lead.annual_revenue)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Loan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'white' }}>
                <DollarSign className="w-5 h-5" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Loan Amount</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.loan_amount}
                          onChange={(e) => setEditableFields({...editableFields, loan_amount: e.target.value})}
                          placeholder="Enter loan amount"
                        />
                      ) : (
                        <p className="font-medium text-lg" style={{ color: 'white' }}>
                          {formatCurrency(lead.loan_amount)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Loan Type</p>
                      {isEditing ? (
                          <Select value={editableFields.loan_type} onValueChange={(value) => setEditableFields({...editableFields, loan_type: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SBA 7(a) Loan">SBA 7(a) Loan</SelectItem>
                              <SelectItem value="SBA 504 Loan">SBA 504 Loan</SelectItem>
                              <SelectItem value="Bridge Loan">Bridge Loan</SelectItem>
                              <SelectItem value="Conventional Loan">Conventional Loan</SelectItem>
                              <SelectItem value="Equipment Financing">Equipment Financing</SelectItem>
                              <SelectItem value="USDA B&I Loan">USDA B&I Loan</SelectItem>
                              <SelectItem value="Working Capital Loan">Working Capital Loan</SelectItem>
                              <SelectItem value="Line of Credit">Line of Credit</SelectItem>
                              <SelectItem value="Land Loan">Land Loan</SelectItem>
                              <SelectItem value="Factoring">Factoring</SelectItem>
                            </SelectContent>
                          </Select>
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>{lead.loan_type || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Net Operating Income</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.net_operating_income}
                          onChange={(e) => setEditableFields({...editableFields, net_operating_income: e.target.value})}
                          placeholder="Enter net operating income"
                        />
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>
                          {formatCurrency((lead as any).net_operating_income)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Bank/Lender Name</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.bank_lender_name}
                          onChange={(e) => setEditableFields({...editableFields, bank_lender_name: e.target.value})}
                          placeholder="Enter bank or lender name"
                        />
                      ) : (
                        <p className="font-medium" style={{ color: 'white' }}>
                          {(lead as any).bank_lender_name || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4" style={{ color: 'white' }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'white' }}>Loan Stage</p>
                      {isEditing ? (
                        <Select value={editableFields.stage} onValueChange={(value) => setEditableFields({...editableFields, stage: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Application">Application</SelectItem>
                            <SelectItem value="Pre-approval">Pre-approval</SelectItem>
                            <SelectItem value="Documentation">Documentation</SelectItem>
                            <SelectItem value="Closing">Closing</SelectItem>
                            <SelectItem value="Funded">Funded</SelectItem>
                          </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium" style={{ color: 'white' }}>{lead.stage || 'N/A'}</p>
                    )}
                  </div>
                </div>

                {/* BDO Information Section */}
                <div className="col-span-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200/10">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4" style={{ color: 'white' }} />
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: 'white' }}>BDO Name</p>
                        {isEditing ? (
                          <Input
                            value={editableFields.bdo_name}
                            onChange={(e) => setEditableFields({...editableFields, bdo_name: e.target.value})}
                            placeholder="Enter BDO name"
                          />
                        ) : (
                          <p className="font-medium" style={{ color: 'white' }}>
                            {(lead as any).bdo_name || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4" style={{ color: 'white' }} />
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: 'white' }}>BDO Telephone</p>
                        {isEditing ? (
                          <Input
                            value={editableFields.bdo_telephone}
                            onChange={(e) => setEditableFields({...editableFields, bdo_telephone: e.target.value})}
                            placeholder="Enter BDO telephone"
                          />
                        ) : (
                          <p className="font-medium" style={{ color: 'white' }}>
                            {(lead as any).bdo_telephone || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4" style={{ color: 'white' }} />
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: 'white' }}>BDO Email</p>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editableFields.bdo_email}
                            onChange={(e) => setEditableFields({...editableFields, bdo_email: e.target.value})}
                            placeholder="Enter BDO email"
                          />
                        ) : (
                          <p className="font-medium" style={{ color: 'white' }}>
                            {(lead as any).bdo_email || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* General Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>General Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generalNotes" style={{ color: 'white' }}>
                Notes
              </Label>
              <Textarea
                id="generalNotes"
                placeholder="Enter general notes about this lead..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                rows={4}
              />
              <Button onClick={saveGeneralNotes}>
                <Save className="w-4 h-4 mr-2" />
                Save General Notes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Client Information */}
        {lead.is_converted_to_client && client && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'white' }}>
                <UserCheck className="w-5 h-5" />
                Existing Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Client Name</p>
                    <p className="font-medium" style={{ color: 'white' }}>{client.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Email</p>
                    <p className="font-medium" style={{ color: 'white' }}>{client.email}</p>
                  </div>
                </div>

                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4" style={{ color: 'white' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'white' }}>Phone</p>
                      <p className="font-medium" style={{ color: 'white' }}>{client.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Badge variant="default" className="w-fit">
                    {client.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Total Loans</p>
                    <p className="font-medium" style={{ color: 'white' }}>{formatNumber(client.total_loans)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Total Loan Value</p>
                    <p className="font-medium" style={{ color: 'white' }}>
                      {formatCurrency(client.total_loan_value)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Client Since</p>
                    <p className="font-medium" style={{ color: 'white' }}>
                      {new Date(client.join_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'white' }}>
              <PhoneIcon className="w-5 h-5" />
              Call Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Call Notes */}
            {callNotes && (
              <div>
                <Label style={{ color: 'white' }}>Previous Call Notes</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm" style={{ color: 'white' }}>
                    {callNotes}
                  </pre>
                </div>
              </div>
            )}

            <Separator />

            {/* Add New Call Note */}
            <div className="space-y-2">
              <Label htmlFor="newCallNote" style={{ color: 'white' }}>
                Add New Call Note
              </Label>
              <Textarea
                id="newCallNote"
                placeholder="Enter your call notes here..."
                value={newCallNote}
                onChange={(e) => setNewCallNote(e.target.value)}
                rows={4}
              />
              <Button onClick={saveCallNotes} disabled={!newCallNote.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save Call Note
              </Button>
            </div>

            <Separator />

            {/* Action Reminders */}
            <div className="space-y-4">
              <Label style={{ color: 'white' }}>Create Action Reminder</Label>
              
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {followUpDate ? format(followUpDate, 'PPP') : 'Select follow-up date'}
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex gap-2">
                  <Button 
                    onClick={createCallReminder} 
                    disabled={!followUpDate}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Reminder
                  </Button>
                  <Button 
                    onClick={createEmailReminder} 
                    disabled={!followUpDate}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Reminder
                  </Button>
                  <Button 
                    onClick={createFollowUpReminder} 
                    disabled={!followUpDate}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Follow-up
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <PhoneDialer 
                trigger={
                  <Button variant="outline" className="flex-1">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Call Lead
                  </Button>
                }
              />
              <EmailComposer 
                trigger={
                  <Button variant="outline" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                }
              />
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/documents')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </Button>
              {!lead.is_converted_to_client && (
                <Button className="flex-1">
                  Convert to Client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
