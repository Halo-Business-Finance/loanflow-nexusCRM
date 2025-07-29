import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Phone, Mail, MapPin, Calendar, DollarSign, Filter, ChevronDown, ChevronUp, Trash2, Bell, MessageSquare } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { LoanManager } from "@/components/LoanManager"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { useNotifications } from "@/hooks/useNotifications"
import { format } from "date-fns"

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

export default function Clients() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const { createNotification } = useNotifications()
  const [clients, setClients] = useState<Client[]>([])
  const [clientLoans, setClientLoans] = useState<{ [key: string]: Loan[] }>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [showNotificationForm, setShowNotificationForm] = useState<string | null>(null)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>()

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
      
      // Fetch loans for all clients
      if (data && data.length > 0) {
        await fetchAllClientLoans(data.map(c => c.id))
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
      // First delete associated loans
      const { error: loansError } = await supabase
        .from('loans')
        .delete()
        .eq('client_id', clientId)

      if (loansError) throw loansError

      // Delete pipeline entries
      const { error: pipelineError } = await supabase
        .from('pipeline_entries')
        .delete()
        .eq('client_id', clientId)

      if (pipelineError) throw pipelineError

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
        description: "Failed to delete client",
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
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      case 'inactive': return 'destructive'
      default: return 'secondary'
    }
  }

  const totalLoanValue = clients.reduce((sum, client) => sum + (client.total_loan_value || 0), 0)
  const activeClients = clients.filter(c => c.status === 'Active').length
  const avgLoanSize = clients.length > 0 ? totalLoanValue / clients.length : 0

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
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Manage your client relationships</p>
          </div>
          <Button className="bg-gradient-primary">
            Add Client
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(clients.length)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(activeClients)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Loan Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {totalLoanValue >= 1000000 
                  ? `${formatCurrency((totalLoanValue / 1000000).toFixed(1))}M` 
                  : formatCurrency(totalLoanValue)
                }
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Loan Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgLoanSize >= 1000 
                  ? `${formatCurrency((avgLoanSize / 1000).toFixed(0))}K` 
                  : formatCurrency(avgLoanSize)
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <div className="grid gap-6">
          {filteredClients.map((client) => {
            const loans = clientLoans[client.id] || []
            const isExpanded = expandedClient === client.id
            
            return (
              <Card key={client.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/6/initials/svg?seed=${client.name}`} />
                        <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Client since {new Date(client.join_date).toLocaleDateString()}
                          </p>
                        </div>
                        
                         <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <EmailComposer 
                            trigger={
                              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <Mail className="h-4 w-4" />
                                {client.email}
                              </button>
                            }
                          />
                          {client.phone && (
                            <PhoneDialer 
                              trigger={
                                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                                  <Phone className="h-4 w-4" />
                                  {client.phone}
                                </button>
                              }
                            />
                          )}
                          {client.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {client.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <Badge variant={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Last activity: {new Date(client.last_activity).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Loans</div>
                        <div className="font-semibold">{formatNumber(client.total_loans)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Value</div>
                        <div className="font-semibold text-accent">
                          {formatCurrency(client.total_loan_value)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <PhoneDialer 
                        trigger={
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <EmailComposer 
                        trigger={
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide Loans
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            View Loans
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowNotificationForm(showNotificationForm === client.id ? null : client.id)}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      {hasRole('admin') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{client.name}</strong>? This will also delete all associated loans and pipeline entries. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteClient(client.id, client.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  {/* Expanded Loan Section */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t">
                      <LoanManager
                        clientId={client.id}
                        clientName={client.name}
                        loans={loans}
                        onLoansUpdate={handleLoansUpdate}
                      />
                    </div>
                  )}

                  {/* Action Reminders */}
                  {showNotificationForm === client.id && (
                    <div className="mt-6 pt-6 border-t space-y-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <h3 className="font-semibold">Create Action Reminder for {client.name}</h3>
                      </div>
                      
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
                            onClick={() => createCallReminder(client.id, client.name)} 
                            disabled={!followUpDate}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Reminder
                          </Button>
                          <Button 
                            onClick={() => createEmailReminder(client.id, client.name)} 
                            disabled={!followUpDate}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email Reminder
                          </Button>
                          <Button 
                            onClick={() => createFollowUpReminder(client.id, client.name)} 
                            disabled={!followUpDate}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            Follow-up
                          </Button>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => setShowNotificationForm(null)}
                          size="sm"
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          
          {filteredClients.length === 0 && (
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  {searchTerm ? 'No clients found matching your search.' : 'No clients yet. Convert some leads to get started!'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}