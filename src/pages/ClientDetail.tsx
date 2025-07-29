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
  ShoppingCart
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
    current_processing_rate: ""
  })

  useEffect(() => {
    if (id && user) {
      fetchClient()
      fetchClientLoans()
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
        current_processing_rate: data.current_processing_rate?.toString() || ""
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

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
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
                      <p className="text-sm text-muted-foreground">Location</p>
                      {isEditing ? (
                        <Input
                          value={editableFields.location}
                          onChange={(e) => setEditableFields({...editableFields, location: e.target.value})}
                          placeholder="Enter location"
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

          {/* POS Information */}
          {(client.pos_system || client.monthly_processing_volume || client.processor_name || isEditing) && (
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
