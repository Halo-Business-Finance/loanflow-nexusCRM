import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Phone, Mail, MapPin, Calendar, DollarSign, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { LoanManager } from "@/components/LoanManager"
import { formatNumber, formatCurrency } from "@/lib/utils"

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
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [clientLoans, setClientLoans] = useState<{ [key: string]: Loan[] }>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedClient, setExpandedClient] = useState<string | null>(null)

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
        .eq('user_id', user?.id)
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
        .eq('user_id', user?.id)

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
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {client.phone}
                            </div>
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
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4" />
                      </Button>
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