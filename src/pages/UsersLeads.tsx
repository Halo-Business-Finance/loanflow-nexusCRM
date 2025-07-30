import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, Eye, Phone, Mail, DollarSign, Calendar, Filter, User, Building, TrendingUp } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface UserWithLeads {
  id: string
  email: string
  name?: string
  role: string
  leads: Lead[]
  totalLeadValue: number
  activeLeads: number
  convertedLeads: number
}

import { Lead } from "@/types/lead"

export default function UsersLeads() {
  const [usersWithLeads, setUsersWithLeads] = useState<UserWithLeads[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (hasRole('admin') || hasRole('super_admin')) {
      fetchUsersWithLeads()
    } else {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to view this page",
        variant: "destructive"
      })
      navigate('/leads')
    }
  }, [user, hasRole])

  const fetchUsersWithLeads = async () => {
    try {
      // Fetch all users with their roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          is_active
        `)
        .eq('is_active', true)

      if (rolesError) throw rolesError

      // Fetch all leads with contact entity data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          contact_entity:contact_entities!contact_entity_id (*)
        `)
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      // Fetch user profiles to get names and emails
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')

      if (usersError) throw usersError

      // Group leads by user_id and merge with user data
      const userLeadsMap = new Map<string, UserWithLeads>()

      // Initialize users
      userRoles.forEach(userRole => {
        const userProfile = usersData?.find(u => u.id === userRole.user_id)
        const fullName = userProfile 
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          : 'Unknown User'

        userLeadsMap.set(userRole.user_id, {
          id: userRole.user_id,
          email: userProfile?.email || 'No email',
          name: fullName || userProfile?.email || 'Unknown User',
          role: userRole.role,
          leads: [],
          totalLeadValue: 0,
          activeLeads: 0,
          convertedLeads: 0
        })
      })

      // Add leads to their respective users
      leadsData?.forEach(leadItem => {
        const userLeads = userLeadsMap.get(leadItem.user_id)
        if (userLeads && leadItem.contact_entity) {
          const lead: Lead = {
            id: leadItem.id,
            contact_entity_id: leadItem.contact_entity_id,
            user_id: leadItem.user_id,
            name: leadItem.contact_entity.name || 'Unknown',
            email: leadItem.contact_entity.email || '',
            phone: leadItem.contact_entity.phone || '',
            stage: leadItem.contact_entity.stage || 'New',
            priority: leadItem.contact_entity.priority || 'medium',
            loan_amount: leadItem.contact_entity.loan_amount || 0,
            loan_type: leadItem.contact_entity.loan_type || '',
            business_name: leadItem.contact_entity.business_name || '',
            created_at: leadItem.created_at,
            is_converted_to_client: leadItem.is_converted_to_client || false,
            last_contact: leadItem.last_contact
          }

          userLeads.leads.push(lead)
          userLeads.totalLeadValue += lead.loan_amount
          
          if (lead.is_converted_to_client) {
            userLeads.convertedLeads++
          } else {
            userLeads.activeLeads++
          }
        }
      })

      const usersArray = Array.from(userLeadsMap.values())
      setUsersWithLeads(usersArray)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching users with leads:', error)
      toast({
        title: "Error",
        description: "Failed to load users and leads data",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  const filteredUsers = usersWithLeads.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.leads.some(lead => 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'application': return 'bg-yellow-100 text-yellow-800'
      case 'pre-approval': return 'bg-purple-100 text-purple-800'
      case 'closing': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const totalStats = {
    totalUsers: usersWithLeads.length,
    totalLeads: usersWithLeads.reduce((sum, user) => sum + user.leads.length, 0),
    totalValue: usersWithLeads.reduce((sum, user) => sum + user.totalLeadValue, 0),
    avgLeadsPerUser: usersWithLeads.length > 0 ? (usersWithLeads.reduce((sum, user) => sum + user.leads.length, 0) / usersWithLeads.length).toFixed(1) : '0'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading users and leads...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Users & Their Leads</h1>
            <p className="text-muted-foreground">View all users and their associated leads distribution</p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchUsersWithLeads}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, leads, or businesses..."
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalLeads}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Lead Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalValue)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Leads/User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.avgLeadsPerUser}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users and Leads List */}
        <div className="space-y-6">
          {filteredUsers.map((userWithLeads) => (
            <Card key={userWithLeads.id} className="shadow-soft">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/6/initials/svg?seed=${userWithLeads.name}`} />
                      <AvatarFallback>
                        {userWithLeads.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{userWithLeads.name}</h3>
                      <p className="text-sm text-muted-foreground">{userWithLeads.email}</p>
                      <Badge variant={userWithLeads.role === 'super_admin' ? 'destructive' : userWithLeads.role === 'admin' ? 'default' : 'secondary'}>
                        {userWithLeads.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{userWithLeads.activeLeads}</div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{userWithLeads.convertedLeads}</div>
                        <div className="text-xs text-muted-foreground">Converted</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{formatCurrency(userWithLeads.totalLeadValue)}</div>
                        <div className="text-xs text-muted-foreground">Total Value</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {userWithLeads.leads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No leads assigned to this user</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userWithLeads.leads.map((lead) => (
                      <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.business_name || 'No business'}</p>
                            </div>
                            <Badge className={getStageColor(lead.stage)}>
                              {lead.stage}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">{formatCurrency(lead.loan_amount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge variant={getPriorityColor(lead.priority)}>
                              {lead.priority} priority
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/leads/${lead.id}`)}
                              className="h-7 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}