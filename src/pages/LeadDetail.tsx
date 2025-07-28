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
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
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
  UserCheck
} from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  business_name?: string
  loan_amount?: number
  loan_type?: string
  stage: string
  priority: string
  credit_score?: number
  income?: number
  annual_revenue?: number
  notes?: string
  call_notes?: string
  last_contact: string
  created_at: string
  is_converted_to_client: boolean
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
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [callNotes, setCallNotes] = useState("")
  const [newCallNote, setNewCallNote] = useState("")
  const [generalNotes, setGeneralNotes] = useState("")

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
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      
      // Map location to address for consistency
      const mappedLead = {
        ...data,
        address: data.location
      }
      
      setLead(mappedLead)
      setCallNotes(data.call_notes || "")
      setGeneralNotes(data.notes || "")
      
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
        .eq('user_id', user?.id)
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
          <Button onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? 'View Mode' : 'Edit Mode'}
          </Button>
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
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Full Name</p>
                    <p className="font-medium" style={{ color: 'white' }}>{lead.name}</p>
                  </div>
                </div>

                {lead.business_name && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" style={{ color: 'white' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'white' }}>Business Name</p>
                      <p className="font-medium" style={{ color: 'white' }}>{lead.business_name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Email</p>
                    <p className="font-medium" style={{ color: 'white' }}>{lead.email}</p>
                  </div>
                </div>

                {lead.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4" style={{ color: 'white' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'white' }}>Phone</p>
                      <p className="font-medium" style={{ color: 'white' }}>{lead.phone}</p>
                    </div>
                  </div>
                )}

                {lead.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4" style={{ color: 'white' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'white' }}>Address</p>
                      <p className="font-medium" style={{ color: 'white' }}>{lead.location}</p>
                    </div>
                  </div>
                )}

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

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'white' }}>
                <DollarSign className="w-5 h-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.loan_amount && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Loan Amount</p>
                    <p className="font-medium text-lg" style={{ color: 'white' }}>
                      ${lead.loan_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {lead.loan_type && (
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Loan Type</p>
                    <p className="font-medium" style={{ color: 'white' }}>{lead.loan_type}</p>
                  </div>
                </div>
              )}

              {lead.credit_score && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Credit Score</p>
                    <p className="font-medium" style={{ color: 'white' }}>{lead.credit_score}</p>
                  </div>
                </div>
              )}

              {lead.income && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Annual Income</p>
                    <p className="font-medium" style={{ color: 'white' }}>
                      ${lead.income.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {lead.annual_revenue && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Annual Revenue</p>
                    <p className="font-medium" style={{ color: 'white' }}>
                      ${lead.annual_revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
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
                    <p className="font-medium" style={{ color: 'white' }}>{client.total_loans}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4" style={{ color: 'white' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>Total Loan Value</p>
                    <p className="font-medium" style={{ color: 'white' }}>
                      ${Number(client.total_loan_value).toLocaleString()}
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
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1">
                <PhoneIcon className="w-4 h-4 mr-2" />
                Call Lead
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
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
