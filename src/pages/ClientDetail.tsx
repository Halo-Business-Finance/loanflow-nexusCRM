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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ActionReminder } from "@/components/ActionReminder"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { LoanManager } from "@/components/LoanManager"
import LoanRequestManager from "@/components/LoanRequestManager"
import { formatNumber, formatCurrency } from "@/lib/utils"
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
  CheckCircle,
  XCircle,
  Bell,
  Calendar,
  Home,
  ShoppingCart,
  Target
} from "lucide-react"

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
  last_activity: string
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
  pos_system?: string
  monthly_processing_volume?: number
  average_transaction_size?: number
  processor_name?: string
  current_processing_rate?: number
  bdo_name?: string
  bdo_telephone?: string
  bdo_email?: string
  // Additional fields from leads
  maturity_date?: string
  interest_rate?: number
  stage?: string
  loan_amount?: number
  loan_type?: string
}

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

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [client, setClient] = useState<Client | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [loanRequests, setLoanRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [callNotes, setCallNotes] = useState("")
  const [newCallNote, setNewCallNote] = useState("")
  const [generalNotes, setGeneralNotes] = useState("")
  const [showReminderDialog, setShowReminderDialog] = useState(false)
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
    status: "",
    priority: "",
    credit_score: "",
    net_operating_income: "",
    bank_lender_name: "",
    annual_revenue: "",
    existing_loan_amount: "",
    income: "",
    pos_system: "",
    monthly_processing_volume: "",
    average_transaction_size: "",
    processor_name: "",
    current_processing_rate: "",
    bdo_name: "",
    bdo_telephone: "",
    bdo_email: "",
    // Additional fields from leads
    maturity_date: "",
    interest_rate: "",
    stage: "",
    loan_amount: "",
    loan_type: ""
  })

  useEffect(() => {
    if (id && user) {
      fetchClient()
      fetchClientLoans()
      fetchLoanRequests()
    }
  }, [id, user])

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setClient(data)
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
        property_payment_amount: data.property_payment_amount?.toString() || "",
        year_established: data.year_established?.toString() || "",
        status: data.status || "",
        priority: data.priority || "",
        credit_score: data.credit_score?.toString() || "",
        net_operating_income: data.net_operating_income?.toString() || "",
        bank_lender_name: data.bank_lender_name || "",
        annual_revenue: data.annual_revenue?.toString() || "",
        existing_loan_amount: data.existing_loan_amount?.toString() || "",
        income: data.income?.toString() || "",
        pos_system: data.pos_system || "",
        monthly_processing_volume: data.monthly_processing_volume?.toString() || "",
        average_transaction_size: data.average_transaction_size?.toString() || "",
        processor_name: data.processor_name || "",
        current_processing_rate: data.current_processing_rate?.toString() || "",
        bdo_name: data.bdo_name || "",
        bdo_telephone: data.bdo_telephone || "",
        bdo_email: data.bdo_email || "",
        // Additional fields from leads
        maturity_date: (data as any).maturity_date || "",
        interest_rate: (data as any).interest_rate?.toString() || "",
        stage: (data as any).stage || "",
        loan_amount: (data as any).loan_amount?.toString() || "",
        loan_type: (data as any).loan_type || ""
      })
    } catch (error) {
      console.error('Error fetching client:', error)
      toast({
        title: "Error",
        description: "Failed to fetch client details",
        variant: "destructive",
      })
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const fetchLoanRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_requests')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setLoanRequests(data || [])
    } catch (error) {
      console.error('Error fetching loan requests:', error)
    }
  }

  const fetchClientLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setLoans(data || [])
    } catch (error) {
      console.error('Error fetching loans:', error)
    }
  }

  const saveCallNotes = async () => {
    if (!client) return

    try {
      const updatedNotes = callNotes + (newCallNote ? `\n\n[${new Date().toLocaleString()}] ${newCallNote}` : "")
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          call_notes: updatedNotes,
          last_activity: new Date().toISOString()
        })
        .eq('id', client.id)

      if (error) throw error

      setCallNotes(updatedNotes)
      setNewCallNote("")
      toast({
        title: "Success",
        description: "Call notes saved successfully",
      })
      
      // Refresh client data
      fetchClient()
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
    if (!client) return

    try {
      const { error } = await supabase
        .from('clients')
        .update({ notes: generalNotes })
        .eq('id', client.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "General notes saved successfully",
      })
      
      // Refresh client data
      fetchClient()
    } catch (error) {
      console.error('Error saving general notes:', error)
      toast({
        title: "Error",
        description: "Failed to save general notes",
        variant: "destructive",
      })
    }
  }

  const saveClientChanges = async () => {
    if (!client) return

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
        status: editableFields.status,
        priority: editableFields.priority,
        credit_score: editableFields.credit_score ? parseInt(editableFields.credit_score) : null,
        net_operating_income: editableFields.net_operating_income ? parseFloat(editableFields.net_operating_income) : null,
        bank_lender_name: editableFields.bank_lender_name || null,
        annual_revenue: editableFields.annual_revenue ? parseFloat(editableFields.annual_revenue) : null,
        existing_loan_amount: editableFields.existing_loan_amount ? parseFloat(editableFields.existing_loan_amount) : null,
        income: editableFields.income ? parseFloat(editableFields.income) : null,
        pos_system: editableFields.pos_system || null,
        monthly_processing_volume: editableFields.monthly_processing_volume ? parseFloat(editableFields.monthly_processing_volume) : null,
        average_transaction_size: editableFields.average_transaction_size ? parseFloat(editableFields.average_transaction_size) : null,
        processor_name: editableFields.processor_name || null,
        current_processing_rate: editableFields.current_processing_rate ? parseFloat(editableFields.current_processing_rate) : null,
        bdo_name: editableFields.bdo_name || null,
        bdo_telephone: editableFields.bdo_telephone || null,
        bdo_email: editableFields.bdo_email || null,
        // Additional fields from leads
        maturity_date: editableFields.maturity_date || null,
        interest_rate: editableFields.interest_rate ? parseFloat(editableFields.interest_rate) : null,
        stage: editableFields.stage || null,
        loan_amount: editableFields.loan_amount ? parseFloat(editableFields.loan_amount) : null,
        loan_type: editableFields.loan_type || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', client.id)

      if (error) throw error

      setIsEditing(false)
      toast({
        title: "Success",
        description: "Client information updated successfully",
      })
      
      // Refresh client data
      fetchClient()
      fetchLoanRequests()
    } catch (error) {
      console.error('Error updating client:', error)
      toast({
        title: "Error",
        description: "Failed to update client information",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      case 'inactive': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Initial Contact': return 'secondary'
      case 'Qualified': return 'default'
      case 'Application': return 'secondary'
      case 'Pre-approval': return 'outline'
      case 'Documentation': return 'secondary'
      case 'Closing': return 'default'
      case 'Funded': return 'default'
      default: return 'secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const handleLoansUpdate = () => {
    fetchClientLoans()
    fetchClient() // Refresh client totals
    fetchLoanRequests()
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

  if (!client) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Client not found</h2>
          <Button onClick={() => navigate('/clients')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
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
            <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground">Client since {new Date(client.join_date).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={getStatusColor(client.status)}>{client.status}</Badge>
              {client.priority && (
                <Badge variant={getPriorityColor(client.priority)}>{client.priority} Priority</Badge>
              )}
              {client.stage && (
                <Badge variant={getStageColor(client.stage)}>{client.stage}</Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <PhoneDialer 
              trigger={
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              }
            />
            <EmailComposer 
              trigger={
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              }
            />
            <Button 
              variant="outline"
              onClick={() => setShowReminderDialog(true)}
            >
              <Bell className="w-4 h-4 mr-2" />
              Set Reminder
            </Button>
            <Button
              onClick={() => {
                if (isEditing) {
                  saveClientChanges()
                } else {
                  setIsEditing(true)
                }
              }}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Client
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Client Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Client Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Loans</div>
                  <div className="text-2xl font-bold">{formatNumber(client.total_loans)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Loan Value</div>
                  <div className="text-2xl font-bold text-accent">{formatCurrency(client.total_loan_value)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Last Activity</div>
                  <div className="text-lg font-semibold">{new Date(client.last_activity).toLocaleDateString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Credit Score</div>
                  <div className="text-lg font-semibold">{client.credit_score || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.name}
                          onChange={(e) => setEditableFields({...editableFields, name: e.target.value})}
                          placeholder="Enter full name"
                        />
                      ) : (
                        <p className="font-medium">{client.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editableFields.email}
                          onChange={(e) => setEditableFields({...editableFields, email: e.target.value})}
                          placeholder="Enter email address"
                        />
                      ) : (
                        <p className="font-medium">{client.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Phone</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.phone}
                          onChange={(e) => setEditableFields({...editableFields, phone: e.target.value})}
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <p className="font-medium">{client.phone || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4" />
                     <div className="flex-1">
                       <p className="text-sm text-muted-foreground">Address</p>
                      {isEditing ? (
                         <Input
                           value={editableFields.location}
                           onChange={(e) => setEditableFields({...editableFields, location: e.target.value})}
                           placeholder="Enter address"
                         />
                      ) : (
                       <p className="font-medium">{client.location || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      {isEditing ? (
                        <Select value={editableFields.status} onValueChange={(value) => setEditableFields({...editableFields, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getStatusColor(client.status)}>{client.status}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Priority</p>
                      {isEditing ? (
                        <Select value={editableFields.priority} onValueChange={(value) => setEditableFields({...editableFields, priority: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium">{client.priority || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.business_name}
                          onChange={(e) => setEditableFields({...editableFields, business_name: e.target.value})}
                          placeholder="Enter business name"
                        />
                      ) : (
                        <p className="font-medium">{client.business_name || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4" />
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
                        <p className="font-medium">{client.business_address || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Year Established</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.year_established}
                          onChange={(e) => setEditableFields({...editableFields, year_established: e.target.value})}
                          placeholder="Enter year established"
                        />
                      ) : (
                        <p className="font-medium">{client.year_established || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" />
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
                        <p className="font-medium">{formatCurrency(client.annual_revenue)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Credit Score</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editableFields.credit_score}
                          onChange={(e) => setEditableFields({...editableFields, credit_score: e.target.value})}
                          placeholder="Enter credit score"
                        />
                      ) : (
                        <p className="font-medium">{client.credit_score || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Property Ownership</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editableFields.owns_property}
                            onCheckedChange={(checked) => setEditableFields({...editableFields, owns_property: checked})}
                          />
                          <span className="text-sm">
                            {editableFields.owns_property ? 'Owns Property' : 'Does not own property'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {client.owns_property ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <p className="font-medium">
                            {client.owns_property ? 'Owns Property' : 'Does not own property'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" />
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
                        <p className="font-medium">{formatCurrency(client.net_operating_income)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Bank/Lender Name</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.bank_lender_name}
                          onChange={(e) => setEditableFields({...editableFields, bank_lender_name: e.target.value})}
                          placeholder="Enter bank or lender name"
                        />
                      ) : (
                        <p className="font-medium">{client.bank_lender_name || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" />
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
                        <p className="font-medium">{formatCurrency(client.existing_loan_amount)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4" />
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
                        <p className="font-medium">{client.interest_rate ? `${client.interest_rate}%` : 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Maturity Date</p>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editableFields.maturity_date}
                          onChange={(e) => setEditableFields({...editableFields, maturity_date: e.target.value})}
                        />
                      ) : (
                        <p className="font-medium">{client.maturity_date ? new Date(client.maturity_date).toLocaleDateString() : 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4" />
                     <div className="flex-1">
                       <p className="text-sm text-muted-foreground">Loan Stage</p>
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
                        <p className="font-medium">{client.stage || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          {(client.owns_property || client.property_payment_amount || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" />
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
                        <p className="font-medium">{formatCurrency(client.property_payment_amount)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Loan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" />
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
                        <p className="font-medium text-lg">
                          {formatCurrency(client.loan_amount)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" />
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
                        <p className="font-medium">{client.loan_type || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Loan Stage</p>
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
                      <p className="font-medium">{client.stage || 'N/A'}</p>
                    )}
                  </div>
                </div>

                {/* BDO Information Section */}
                <div className="col-span-full mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                          <p className="font-medium">
                            {client.bdo_name || 'N/A'}
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
                          <p className="font-medium">
                            {client.bdo_telephone || 'N/A'}
                          </p>
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
                          <p className="font-medium">
                            {client.bdo_email || 'N/A'}
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

          {/* Loan Requests Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Loan Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LoanRequestManager
                clientId={client.id}
                loanRequests={loanRequests}
                onLoanRequestsUpdate={setLoanRequests}
              />
            </CardContent>
          </Card>
          {(client.pos_system || client.monthly_processing_volume || client.average_transaction_size || client.processor_name || client.current_processing_rate || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  POS Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">POS System</p>
                        {isEditing ? (
                          <Input
                            value={editableFields.pos_system}
                            onChange={(e) => setEditableFields({...editableFields, pos_system: e.target.value})}
                            placeholder="Enter POS system"
                          />
                        ) : (
                          <p className="font-medium">{client.pos_system || 'N/A'}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4" />
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
                          <p className="font-medium">{formatCurrency(client.monthly_processing_volume)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4" />
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
                          <p className="font-medium">{formatCurrency(client.average_transaction_size)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Current Processor</p>
                        {isEditing ? (
                          <Input
                            value={editableFields.processor_name}
                            onChange={(e) => setEditableFields({...editableFields, processor_name: e.target.value})}
                            placeholder="Enter processor name"
                          />
                        ) : (
                          <p className="font-medium">{client.processor_name || 'N/A'}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4" />
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
                          <p className="font-medium">{client.current_processing_rate ? `${client.current_processing_rate}%` : 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Loan Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LoanManager
                clientId={client.id}
                clientName={client.name}
                loans={loans}
                onLoansUpdate={handleLoansUpdate}
              />
            </CardContent>
          </Card>

          {/* General Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>General Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="generalNotes">
                  Notes
                </Label>
                <Textarea
                  id="generalNotes"
                  placeholder="Enter general notes about this client..."
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
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Call Notes */}
              {callNotes && (
                <div>
                  <Label>Previous Call Notes</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {callNotes}
                    </pre>
                  </div>
                </div>
              )}

              <Separator />

              {/* Add New Call Note */}
              <div className="space-y-2">
                <Label htmlFor="newCallNote">
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
        </div>
      </div>

      {/* Action Reminder Dialog */}
      {client && (
        <ActionReminder
          entityId={client.id}
          entityName={client.name}
          entityType="client"
          isOpen={showReminderDialog}
          onClose={() => setShowReminderDialog(false)}
        />
      )}
    </Layout>
  )
}
