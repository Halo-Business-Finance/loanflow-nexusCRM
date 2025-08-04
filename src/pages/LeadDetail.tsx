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
import { ActionReminder } from "@/components/ActionReminder"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { QuickEmail } from "@/components/QuickEmail"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { useNotifications } from "@/hooks/useNotifications"
import { format } from "date-fns"
import LoanRequestManager from "@/components/LoanRequestManager"
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
  Send,
  UserCheck,
  Home,
  CheckCircle,
  XCircle,
  Target,
  FileText,
  Bell,
  Trash2,
  ChevronDown,
  ShoppingCart
} from "lucide-react"

import { Lead, Client as ClientType } from "@/types/lead"
import { mapLeadFields, mapClientFields, extractContactEntityData, LEAD_WITH_CONTACT_QUERY, CLIENT_WITH_CONTACT_QUERY } from "@/lib/field-mapping"

// Using imported ClientType interface from types/lead.ts

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { createNotification } = useNotifications()

  console.log('LeadDetail: User authenticated:', !!user)
  console.log('LeadDetail: Lead ID from params:', id)
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [client, setClient] = useState<ClientType | null>(null)
  const [loading, setLoading] = useState(true)
  const [loanRequests, setLoanRequests] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [callNotes, setCallNotes] = useState("")
  const [newCallNote, setNewCallNote] = useState("")
  const [generalNotes, setGeneralNotes] = useState("")
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>()
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [editableFields, setEditableFields] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    business_name: "",
    business_address: "",
    naics_code: "",
    ownership_structure: "",
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
    bdo_email: "",
    // POS Information fields
    pos_system: "",
    monthly_processing_volume: "",
    average_transaction_size: "",
    processor_name: "",
    current_processing_rate: ""
  })

  useEffect(() => {
    if (id && user) {
      fetchLead()
    }
  }, [id, user])

  const fetchLead = async () => {
    try {
      console.log('fetchLead: Fetching lead with ID:', id)
      const { data, error } = await supabase
        .from('leads')
        .select(LEAD_WITH_CONTACT_QUERY)
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('fetchLead: Error fetching lead:', error)
        throw error
      }
      
      if (!data) {
        console.log('fetchLead: No lead found with ID:', id)
        toast({
          title: "Error",
          description: "Lead not found or you don't have permission to view it",
          variant: "destructive",
        })
        navigate('/leads')
        return
      }
      
      // Merge contact entity data with lead data
      const mergedLead = {
        ...data,
        ...data.contact_entity
      }
      setLead(mergedLead)
      setCallNotes(mergedLead.call_notes || "")
      setGeneralNotes(mergedLead.notes || "")
      
      // Set editable fields for edit mode
      setEditableFields({
        name: mergedLead.name || "",
        email: mergedLead.email || "",
        phone: mergedLead.phone || "",
        location: mergedLead.location || "",
        business_name: mergedLead.business_name || "",
        business_address: mergedLead.business_address || "",
        naics_code: mergedLead.naics_code || "",
        ownership_structure: mergedLead.ownership_structure || "",
        owns_property: mergedLead.owns_property || false,
        property_payment_amount: mergedLead.property_payment_amount?.toString() || "",
        year_established: mergedLead.year_established?.toString() || "",
        loan_amount: mergedLead.loan_amount?.toString() || "",
        loan_type: mergedLead.loan_type || "",
        stage: mergedLead.stage || "",
        priority: mergedLead.priority || "",
        credit_score: mergedLead.credit_score?.toString() || "",
        net_operating_income: mergedLead.net_operating_income?.toString() || "",
        bank_lender_name: mergedLead.bank_lender_name || "",
        annual_revenue: mergedLead.annual_revenue?.toString() || "",
        interest_rate: mergedLead.interest_rate?.toString() || "",
        maturity_date: mergedLead.maturity_date || "",
        existing_loan_amount: mergedLead.existing_loan_amount?.toString() || "",
        bdo_name: mergedLead.bdo_name || "",
        bdo_telephone: mergedLead.bdo_telephone || "",
        bdo_email: mergedLead.bdo_email || "",
        // POS Information fields
        pos_system: mergedLead.pos_system || "",
        monthly_processing_volume: mergedLead.monthly_processing_volume?.toString() || "",
        average_transaction_size: mergedLead.average_transaction_size?.toString() || "",
        processor_name: mergedLead.processor_name || "",
        current_processing_rate: mergedLead.current_processing_rate?.toString() || ""
      })
      
      // If lead is converted, fetch client data
      if (data.is_converted_to_client) {
        await fetchClientData(data.id)
      }
      
      // Fetch loan requests for this lead
      await fetchLoanRequests(data.id)
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
        .select(CLIENT_WITH_CONTACT_QUERY)
        .eq('lead_id', leadId)
        .single()

      if (error) {
        console.error('Error fetching client data:', error)
        return
      }
      
      // Merge client with contact entity data
      const mergedClient = mapClientFields(data)
      setClient(mergedClient)
    } catch (error) {
      console.error('Error fetching client:', error)
    }
  }

  const fetchLoanRequests = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('loan_requests')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setLoanRequests(data || [])
    } catch (error) {
      console.error('Error fetching loan requests:', error)
    }
  }

  const saveCallNotes = async () => {
    if (!lead || !user) return

    try {
      // Get user's profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      const userName = profile 
        ? `${profile.first_name} ${profile.last_name}`.trim() 
        : user.email?.split('@')[0] || 'Unknown User'

      const updatedNotes = callNotes + (newCallNote ? `\n\n${userName} [${new Date().toLocaleString()}]: ${newCallNote}` : "")
      
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
        .from('contact_entities')
        .update({ notes: generalNotes })
        .eq('id', lead.contact_entity_id)

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
      // Update the contact entity with all the lead details
      const contactUpdateData: any = {
        name: editableFields.name,
        email: editableFields.email,
        phone: editableFields.phone || null,
        location: editableFields.location || null,
        business_name: editableFields.business_name || null,
        business_address: editableFields.business_address || null,
        naics_code: editableFields.naics_code || null,
        ownership_structure: editableFields.ownership_structure || null,
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
        bdo_email: editableFields.bdo_email || null,
        pos_system: editableFields.pos_system || null,
        monthly_processing_volume: editableFields.monthly_processing_volume ? parseFloat(editableFields.monthly_processing_volume) : null,
        average_transaction_size: editableFields.average_transaction_size ? parseFloat(editableFields.average_transaction_size) : null,
        processor_name: editableFields.processor_name || null,
        current_processing_rate: editableFields.current_processing_rate ? parseFloat(editableFields.current_processing_rate) : null
      }

      // Check if stage is being changed to "Loan Funded" and lead isn't already converted
      const isBeingFunded = editableFields.stage === "Loan Funded" && lead.stage !== "Loan Funded" && !lead.is_converted_to_client

      // Update the contact entity
      const { error: contactError } = await supabase
        .from('contact_entities')
        .update(contactUpdateData)
        .eq('id', lead.contact_entity_id)

      if (contactError) throw contactError

      // Update the lead table only with lead-specific fields (NO STAGE - stage is in contact_entities)
      const leadUpdateData: any = {
        last_contact: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (isBeingFunded) {
        // Mark lead as converted
        leadUpdateData.is_converted_to_client = true
        leadUpdateData.converted_at = new Date().toISOString()
      }

      const { error: leadError } = await supabase
        .from('leads')
        .update(leadUpdateData)
        .eq('id', lead.id)

      console.log('Lead update result:', { leadUpdateData, leadError })

      if (leadError) {
        console.error('Lead update error:', leadError)
        throw leadError
      }

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
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Lead data:', lead)
      console.error('Editable fields:', editableFields)
      
      toast({
        title: "Error",
        description: `Failed to update lead information: ${error?.message || 'Unknown error'}`,
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
        income: lead.income || null,
        // POS Information fields
        pos_system: editableFields.pos_system || null,
        monthly_processing_volume: editableFields.monthly_processing_volume ? parseFloat(editableFields.monthly_processing_volume) : null,
        average_transaction_size: editableFields.average_transaction_size ? parseFloat(editableFields.average_transaction_size) : null,
        processor_name: editableFields.processor_name || null,
        current_processing_rate: editableFields.current_processing_rate ? parseFloat(editableFields.current_processing_rate) : null
      }

      // Create client record with reference to existing contact entity
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: lead.user_id,
          contact_entity_id: lead.contact_entity_id,
          lead_id: lead.id,
          status: 'Active'
        })
        .select(CLIENT_WITH_CONTACT_QUERY)
        .single()

      if (clientError) throw clientError

      // Create a loan record if loan amount is specified
      if (editableFields.loan_amount && parseFloat(editableFields.loan_amount) > 0) {
        const loanAmount = Math.max(0, parseFloat(editableFields.loan_amount) || 0)
        const loanData = {
          client_id: newClient.id,
          lead_id: lead.id,
          user_id: user.id,
          loan_amount: loanAmount,
          loan_type: editableFields.loan_type?.trim() || 'Mortgage',
          interest_rate: editableFields.interest_rate ? Math.max(0, parseFloat(editableFields.interest_rate) || 0) : null,
          maturity_date: editableFields.maturity_date || null,
          status: 'Active',
          remaining_balance: loanAmount
        }

        const { error: loanError } = await supabase
          .from('loans')
          .insert(loanData)

        if (loanError) {
          console.error('Error creating loan:', loanError)
          // Don't throw error here as client was already created successfully
        }
      }

      // Merge client with contact entity data
      const mergedClient = mapClientFields(newClient)
      setClient(mergedClient)
      
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
    if (!lead) {
      console.log('deleteLead: No lead found')
      return
    }

    console.log('deleteLead: Starting deletion for lead:', lead.id, 'name:', lead.name)

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

      if (error) {
        console.error('deleteLead: Database error:', error)
        throw error
      }

      console.log('deleteLead: Lead deleted successfully from database')
      
      toast({
        title: "Success!",
        description: `${lead.name || 'Lead'} has been deleted successfully.`,
      })

      console.log('deleteLead: Navigating to /leads')
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

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'secondary'
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStageColor = (stage?: string) => {
    if (!stage) return 'secondary'
    switch (stage) {
      case 'New Lead': return 'outline'
      case 'Initial Contact': return 'secondary'
      case 'Qualified': return 'default'
      case 'Application': return 'default'
      case 'Loan Approved': return 'default'
      case 'Documentation': return 'default'
      case 'Closing': return 'default'
      case 'Funded': return 'default'
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
          <h1 className="text-2xl font-bold mb-4 text-foreground">Lead Not Found</h1>
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
            <Button 
              variant="modern" 
              className="h-10 px-4 rounded-lg font-medium"
              onClick={() => navigate('/leads')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
             <div className="bg-gradient-to-r from-card to-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-medium">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
                   <User className="w-6 h-6 text-primary-foreground" />
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{lead.name}</h1>
                   <p className="text-sm text-muted-foreground">Lead Profile</p>
                 </div>
               </div>
               <div className="flex items-center gap-3 flex-wrap">
                 <Badge 
                   variant={getPriorityColor(lead.priority)}
                   className="px-3 py-1 rounded-full font-medium shadow-sm"
                 >
                   {lead.priority} Priority
                 </Badge>
                 <Badge 
                   variant={getStageColor(lead.stage)}
                   className="px-3 py-1 rounded-full font-medium shadow-sm"
                 >
                   {lead.stage}
                 </Badge>
                 {lead.is_converted_to_client && (
                   <Badge 
                     variant="default"
                     className="px-3 py-1 rounded-full font-medium shadow-sm bg-gradient-to-r from-accent to-accent/80"
                   >
                     Client
                   </Badge>
                 )}
               </div>
             </div>
          </div>
          <div className="flex flex-col gap-3">
            {/* First Row - Quick Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <PhoneDialer 
                phoneNumber={lead.phone}
                trigger={
                  <Button
                    size="sm"
                    variant="gradient-blue"
                    className="h-10 px-4 rounded-lg font-medium shadow-md"
                  >
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                }
              />
              <EmailComposer 
                recipientEmail={lead.email}
                recipientName={lead.name}
                trigger={
                  <Button
                    size="sm"
                    variant="gradient-green"
                    className="h-10 px-4 rounded-lg font-medium shadow-md"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                }
              />
              <QuickEmail 
                recipientEmail={lead.email}
                recipientName={lead.name}
                trigger={
                  <Button
                    size="sm"
                    variant="gradient-orange"
                    className="h-10 px-4 rounded-lg font-medium shadow-md"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Quick Email
                  </Button>
                }
              />
              <Button
                size="sm"
                variant="gradient-purple"
                className="h-10 px-4 rounded-lg font-medium shadow-md"
                onClick={() => navigate(`/leads/${lead.id}/documents`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </Button>
              <Button
                onClick={() => setShowReminderDialog(true)}
                size="sm"
                variant="gradient"
                className="h-10 px-4 rounded-lg font-medium shadow-md"
              >
                <Bell className="w-4 h-4 mr-2" />
                Reminder
              </Button>
            </div>
            
            {/* Second Row - Edit/Save/Delete Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                variant="modern"
                className="h-10 px-4 rounded-lg font-medium"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              {isEditing && (
                <Button 
                  onClick={saveLeadChanges}
                  variant="gradient"
                  className="h-10 px-4 rounded-lg font-medium shadow-md"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="gradient-red"
                    className="h-10 px-4 rounded-lg font-medium shadow-md"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Lead
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{lead?.name || 'this lead'}</strong>? This action cannot be undone and you will be redirected back to the leads page.
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Lead Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    {isEditing ? (
                      <Input
                        value={editableFields.name}
                        onChange={(e) => setEditableFields({...editableFields, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{lead.name}</p>
                    )}
                  </div>
                </div>


                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
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
                          <button className="font-medium hover:text-primary transition-colors text-left text-foreground">
                            {lead.email}
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {isEditing ? (
                      <Input
                        value={editableFields.phone}
                        onChange={(e) => setEditableFields({...editableFields, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      lead.phone ? (
                        <PhoneDialer 
                          phoneNumber={lead.phone} // Pre-fill with this number
                          trigger={
                            <button className="font-medium hover:text-primary transition-colors text-left text-foreground">
                              {lead.phone}
                            </button>
                          }
                        />
                      ) : (
                        <p className="font-medium text-foreground">N/A</p>
                      )
                    )}
                  </div>
                </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Address</p>
                    {isEditing ? (
                      <Input
                        value={editableFields.location}
                        onChange={(e) => setEditableFields({...editableFields, location: e.target.value})}
                           placeholder="Enter address"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{lead.location || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Stage</p>
                      {isEditing ? (
                        <Select value={editableFields.stage} onValueChange={(value) => setEditableFields({...editableFields, stage: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="New Lead">New Lead</SelectItem>
                              <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                              <SelectItem value="Loan Application Signed">Loan Application Signed</SelectItem>
                              <SelectItem value="Waiting for Documentation">Waiting for Documentation</SelectItem>
                              <SelectItem value="Pre-Approved">Pre-Approved</SelectItem>
                              <SelectItem value="Term Sheet Signed">Term Sheet Signed</SelectItem>
                              <SelectItem value="Loan Approved">Loan Approved</SelectItem>
                              <SelectItem value="Closing">Closing</SelectItem>
                              <SelectItem value="Loan Funded">Loan Funded</SelectItem>
                           </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getStageColor(lead.stage)}>{lead.stage}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Priority</p>
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
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Credit Score</p>
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
                      <p className="font-medium text-foreground">{formatNumber(lead.credit_score)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Contact</p>
                    <p className="font-medium text-foreground">
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
              <CardTitle className="text-foreground">
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.business_name}
                          onChange={(e) => setEditableFields({...editableFields, business_name: e.target.value})}
                          placeholder="Enter business name"
                        />
                      ) : (
                        <p className="font-medium text-foreground">{lead.business_name || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Business Address</p>
                      {isEditing ? (
                        <Textarea
                          value={editableFields.business_address}
                          onChange={(e) => setEditableFields({...editableFields, business_address: e.target.value})}
                          placeholder="Enter business address"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{lead.business_address || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Year Established</p>
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
                        <p className="font-medium text-foreground">
                          {(lead as any).year_established || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">NAICS Code</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.naics_code}
                          onChange={(e) => setEditableFields({...editableFields, naics_code: e.target.value})}
                          placeholder="Enter NAICS code (e.g., 541110)"
                          maxLength={6}
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {(lead as any).naics_code || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Ownership Structure</p>
                      {isEditing ? (
                        <Select value={editableFields.ownership_structure} onValueChange={(value) => setEditableFields({...editableFields, ownership_structure: value})}>
                          <SelectTrigger className="bg-background border-border z-50">
                            <SelectValue placeholder="Select ownership structure" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-lg z-50">
                            <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="llc">Limited Liability Company (LLC)</SelectItem>
                            <SelectItem value="corporation">Corporation (C-Corp)</SelectItem>
                            <SelectItem value="s_corporation">S Corporation (S-Corp)</SelectItem>
                            <SelectItem value="limited_partnership">Limited Partnership (LP)</SelectItem>
                            <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                            <SelectItem value="professional_corporation">Professional Corporation (PC)</SelectItem>
                            <SelectItem value="nonprofit">Nonprofit Corporation</SelectItem>
                            <SelectItem value="cooperative">Cooperative</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium text-foreground">
                          {(lead as any).ownership_structure ? 
                            {
                              'sole_proprietorship': 'Sole Proprietorship',
                              'partnership': 'Partnership',
                              'llc': 'Limited Liability Company (LLC)',
                              'corporation': 'Corporation (C-Corp)',
                              's_corporation': 'S Corporation (S-Corp)',
                              'limited_partnership': 'Limited Partnership (LP)',
                              'llp': 'Limited Liability Partnership (LLP)',
                              'professional_corporation': 'Professional Corporation (PC)',
                              'nonprofit': 'Nonprofit Corporation',
                              'cooperative': 'Cooperative'
                            }[(lead as any).ownership_structure] || (lead as any).ownership_structure
                            : 'N/A'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.annual_revenue}
                          onChange={(e) => setEditableFields({...editableFields, annual_revenue: e.target.value})}
                          placeholder="Enter annual revenue"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {formatCurrency(lead.annual_revenue)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Property Ownership</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Switch
                            checked={editableFields.owns_property}
                            onCheckedChange={(checked) => setEditableFields({...editableFields, owns_property: checked})}
                          />
                          <span className="text-sm text-foreground">
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
                          <p className="font-medium text-foreground">
                            {lead.owns_property ? 'Owns Property' : 'Does not own property'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>


                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Net Operating Income</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.net_operating_income}
                          onChange={(e) => setEditableFields({...editableFields, net_operating_income: e.target.value})}
                          placeholder="Enter net operating income"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {formatCurrency((lead as any).net_operating_income)}
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Conditional property-related fields */}
                {(lead.owns_property || editableFields.owns_property) && (
                  <div className="col-span-full">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 pt-4">
                      <Home className="w-5 h-5" />
                      Property Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200/10">
                      {/* Property Fields Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Property Payment Amount</p>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editableFields.property_payment_amount}
                                onChange={(e) => setEditableFields({...editableFields, property_payment_amount: e.target.value})}
                                placeholder="Enter monthly/yearly payment amount"
                              />
                            ) : (
                              <p className="font-medium text-foreground">
                                {(lead as any).property_payment_amount ? formatCurrency((lead as any).property_payment_amount) : 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Interest Rate (%)</p>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editableFields.interest_rate}
                                onChange={(e) => setEditableFields({...editableFields, interest_rate: e.target.value})}
                                placeholder="Enter interest rate"
                              />
                            ) : (
                              <p className="font-medium text-foreground">
                                {lead.interest_rate ? `${lead.interest_rate}%` : 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Property Fields Right Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Loan Maturity Date</p>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editableFields.maturity_date}
                                onChange={(e) => setEditableFields({...editableFields, maturity_date: e.target.value})}
                              />
                            ) : (
                              <p className="font-medium text-foreground">
                                {lead.maturity_date ? new Date(lead.maturity_date).toLocaleDateString() : 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Existing Loan Amount</p>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editableFields.existing_loan_amount}
                                onChange={(e) => setEditableFields({...editableFields, existing_loan_amount: e.target.value})}
                                placeholder="Enter existing loan amount"
                              />
                            ) : (
                              <p className="font-medium text-foreground">
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
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* POS Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                POS Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">POS System</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.pos_system}
                          onChange={(e) => setEditableFields({...editableFields, pos_system: e.target.value})}
                          placeholder="Enter POS system name"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {(lead as any).pos_system || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Monthly Processing Volume</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.monthly_processing_volume}
                          onChange={(e) => setEditableFields({...editableFields, monthly_processing_volume: e.target.value})}
                          placeholder="Enter monthly volume"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {formatCurrency((lead as any).monthly_processing_volume)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Average Transaction Size</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.average_transaction_size}
                          onChange={(e) => setEditableFields({...editableFields, average_transaction_size: e.target.value})}
                          placeholder="Enter average transaction size"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {formatCurrency((lead as any).average_transaction_size)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Current Processor</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.processor_name}
                          onChange={(e) => setEditableFields({...editableFields, processor_name: e.target.value})}
                          placeholder="Enter processor name"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {(lead as any).processor_name || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Current Processing Rate (%)</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editableFields.current_processing_rate}
                          onChange={(e) => setEditableFields({...editableFields, current_processing_rate: e.target.value})}
                          placeholder="Enter processing rate"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {(lead as any).current_processing_rate ? `${(lead as any).current_processing_rate}%` : 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Loan Amount</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.loan_amount}
                          onChange={(e) => setEditableFields({...editableFields, loan_amount: e.target.value})}
                          placeholder="Enter loan amount"
                        />
                      ) : (
                        <p className="font-medium text-lg text-foreground">
                          {formatCurrency(lead.loan_amount)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Loan Type</p>
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
                        <p className="font-medium text-foreground">{lead.loan_type || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editableFields.interest_rate}
                          onChange={(e) => setEditableFields({...editableFields, interest_rate: e.target.value})}
                          placeholder="Enter interest rate (%)"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {lead.interest_rate ? `${lead.interest_rate}%` : 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Maturity Date</p>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editableFields.maturity_date}
                          onChange={(e) => setEditableFields({...editableFields, maturity_date: e.target.value})}
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {lead.maturity_date ? new Date(lead.maturity_date).toLocaleDateString() : 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Bank/Lender Name</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.bank_lender_name}
                          onChange={(e) => setEditableFields({...editableFields, bank_lender_name: e.target.value})}
                          placeholder="Enter bank or lender name"
                        />
                      ) : (
                        <p className="font-medium text-foreground">
                          {(lead as any).bank_lender_name || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Loan Stage</p>
                      {isEditing ? (
                        <Select value={editableFields.stage} onValueChange={(value) => setEditableFields({...editableFields, stage: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="New Lead">New Lead</SelectItem>
                              <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                              <SelectItem value="Loan Application Signed">Loan Application Signed</SelectItem>
                              <SelectItem value="Waiting for Documentation">Waiting for Documentation</SelectItem>
                              <SelectItem value="Pre-Approved">Pre-Approved</SelectItem>
                              <SelectItem value="Term Sheet Signed">Term Sheet Signed</SelectItem>
                              <SelectItem value="Loan Approved">Loan Approved</SelectItem>
                              <SelectItem value="Closing">Closing</SelectItem>
                              <SelectItem value="Loan Funded">Loan Funded</SelectItem>
                           </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium text-foreground">{lead.stage || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                {/* BDO Information Section */}
                <div className="col-span-full mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    BDO Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200/10">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">BDO Name</p>
                        {isEditing ? (
                          <Input
                            value={editableFields.bdo_name}
                            onChange={(e) => setEditableFields({...editableFields, bdo_name: e.target.value})}
                            placeholder="Enter BDO name"
                          />
                        ) : (
                          <p className="font-medium text-foreground">
                            {lead.bdo_name || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">BDO Telephone</p>
                        {isEditing ? (
                          <Input
                            value={editableFields.bdo_telephone}
                            onChange={(e) => setEditableFields({...editableFields, bdo_telephone: e.target.value})}
                            placeholder="Enter BDO telephone"
                          />
                        ) : (
                          lead.bdo_telephone ? (
                            <PhoneDialer 
                              phoneNumber={lead.bdo_telephone} // Pre-fill with BDO telephone
                              trigger={
                                <button className="font-medium hover:text-primary transition-colors text-left text-foreground">
                                  {lead.bdo_telephone}
                                </button>
                              }
                            />
                          ) : (
                            <p className="font-medium text-foreground">N/A</p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">BDO Email</p>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editableFields.bdo_email}
                            onChange={(e) => setEditableFields({...editableFields, bdo_email: e.target.value})}
                            placeholder="Enter BDO email"
                          />
                        ) : (
                          <p className="font-medium text-foreground">
                            {lead.bdo_email || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

            </CardContent>
          </Card>
        </div>

        {/* Loan Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              Loan Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoanRequestManager
              leadId={lead?.id}
              loanRequests={loanRequests}
              onLoanRequestsUpdate={setLoanRequests}
            />
          </CardContent>
        </Card>

        {/* General Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">General Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generalNotes" className="text-foreground">
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

        {/* Call Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              Call Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Call Notes */}
            {callNotes && (
              <div>
                <Label className="text-foreground">Previous Call Notes</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">
                    {callNotes}
                  </pre>
                </div>
              </div>
            )}

            <Separator />

            {/* Add New Call Note */}
            <div className="space-y-2">
              <Label htmlFor="newCallNote" className="text-foreground">
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
          </CardContent>
        </Card>

        {/* Existing Client Information */}
        {lead.is_converted_to_client && client && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Existing Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client Name</p>
                    <p className="font-medium text-foreground">{client.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{client.email}</p>
                  </div>
                </div>

                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                     <div>
                       <p className="text-sm text-muted-foreground">Phone</p>
                       <PhoneDialer 
                         phoneNumber={client.phone} // Pre-fill with client phone
                         trigger={
                           <button className="font-medium hover:text-primary transition-colors text-left text-foreground">
                             {client.phone}
                           </button>
                         }
                       />
                     </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Badge variant="default" className="w-fit">
                    {client.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loans</p>
                    <p className="font-medium text-foreground">{formatNumber(client.total_loans)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loan Value</p>
                    <p className="font-medium text-foreground">
                      {formatCurrency(client.total_loan_value)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client Since</p>
                    <p className="font-medium text-foreground">
                      {new Date(client.join_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Action Reminder Dialog */}
      {lead && (
        <ActionReminder
          entityId={lead.id}
          entityName={lead.name}
          entityType="lead"
          isOpen={showReminderDialog}
          onClose={() => setShowReminderDialog(false)}
        />
      )}
    </Layout>
  )
}
