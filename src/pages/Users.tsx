import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar, 
  Filter, 
  User, 
  Building, 
  TrendingUp,
  UserPlus,
  RotateCcw,
  Trash2,
  Edit3,
  Archive,
  Undo2,
  Shield,
  UserCheck,
  Activity,
  UsersIcon
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Lead } from "@/types/lead"

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

interface UserProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  role: string
  is_active: boolean
  archived_at: string | null
  archive_reason: string | null
  created_at: string
  updated_at: string
}

export default function Users() {
  // User Management State
  const [users, setUsers] = useState<UserProfile[]>([])
  const [showNewUserDialog, setShowNewUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'agent' as const,
    password: ''
  })

  // Users & Leads State
  const [usersWithLeads, setUsersWithLeads] = useState<UserWithLeads[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  // Shared State
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (hasRole('admin') || hasRole('super_admin')) {
      fetchUsers()
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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role, is_active)
        `)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Transform the data to include role information
      const transformedUsers = profiles?.map((profile: any) => ({
        ...profile,
        user_id: profile.id,
        phone: profile.phone || '',
        role: profile.user_roles && profile.user_roles.length > 0 
          ? profile.user_roles.find((ur: any) => ur.is_active)?.role || profile.user_roles[0]?.role || 'agent' 
          : 'agent'
      })) || []

      console.log('Fetched users:', transformedUsers.length, transformedUsers)

      setUsers(transformedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersWithLeads = async () => {
    try {
      setLoading(true)
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles(role)
        `)

      if (profilesError) throw profilesError

      const usersData: UserWithLeads[] = []

      for (const profile of profiles || []) {
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select(`
            *,
            contact_entities(*)
          `)
          .eq('user_id', profile.id)

        if (leadsError) {
          console.error('Error fetching leads for user:', profile.id, leadsError)
          continue
        }

        const transformedLeads = leads?.map(lead => ({
          ...lead,
          contact_entity: lead.contact_entities
        })) || []

        const totalLeadValue = transformedLeads.reduce((sum, lead) => {
          return sum + (lead.contact_entity?.loan_amount || 0)
        }, 0)

        const activeLeads = transformedLeads.filter(lead => 
          lead.contact_entity?.stage && !['Lost', 'Loan Funded'].includes(lead.contact_entity.stage)
        ).length

        const convertedLeads = transformedLeads.filter(lead => 
          lead.contact_entity?.stage === 'Loan Funded'
        ).length

        usersData.push({
          id: profile.id,
          email: profile.email,
          name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.first_name || profile.email,
          role: Array.isArray(profile.user_roles) ? profile.user_roles[0]?.role || 'agent' : 'agent',
          leads: transformedLeads,
          totalLeadValue,
          activeLeads,
          convertedLeads
        })
      }

      setUsersWithLeads(usersData)
    } catch (error) {
      console.error('Error fetching users with leads:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user lead data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createNewUser = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            first_name: newUserData.firstName,
            last_name: newUserData.lastName,
            phone: newUserData.phone,
            role: newUserData.role
          }
        }
      })

      if (error) throw error

      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: newUserData.role })
          .eq('user_id', data.user.id)

        if (roleError) {
          console.error('Error updating user role:', roleError)
        }
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })

      setShowNewUserDialog(false)
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'agent',
        password: ''
      })

      fetchUsers()
      fetchUsersWithLeads()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      })
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      toast({
        title: "Success",
        description: "User deleted successfully",
      })

      fetchUsers()
      fetchUsersWithLeads()
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  const refreshUserData = () => {
    fetchUsers()
    fetchUsersWithLeads()
  }

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsersWithLeads = usersWithLeads.filter(user =>
    `${user.name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'admin': return 'default'
      case 'manager': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage team members and analyze user performance</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={refreshUserData}
                disabled={loading}
                className="gap-2"
              >
                <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account for your team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newUserData.firstName}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newUserData.lastName}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newUserData.phone}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUserData.role} onValueChange={(value: any) => setNewUserData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {hasRole('super_admin') && <SelectItem value="super_admin">Super Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={createNewUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="management" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="management" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Users & Leads Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="management" className="space-y-6 mt-6">
              {/* User Management Grid */}
              <div className="grid gap-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No users found</h3>
                    <p className="text-muted-foreground">Add your first team member to get started.</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                  {user.first_name} {user.last_name}
                                </h3>
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                  {user.role.replace('_', ' ')}
                                </Badge>
                                {!user.is_active && (
                                  <Badge variant="secondary">Archived</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {user.phone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(user.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit User</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteUser(user.user_id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete User</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              {/* Users & Leads Analytics */}
              <div className="grid gap-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading user analytics...</p>
                  </div>
                ) : filteredUsersWithLeads.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No user data found</h3>
                    <p className="text-muted-foreground">User performance data will appear here once leads are created.</p>
                  </div>
                ) : (
                  filteredUsersWithLeads.map((userWithLeads) => (
                    <Card key={userWithLeads.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {userWithLeads.name?.charAt(0) || userWithLeads.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                {userWithLeads.name}
                                <Badge variant={getRoleBadgeVariant(userWithLeads.role)}>
                                  {userWithLeads.role.replace('_', ' ')}
                                </Badge>
                              </h3>
                              <p className="text-sm text-muted-foreground">{userWithLeads.email}</p>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(selectedUser === userWithLeads.id ? null : userWithLeads.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {selectedUser === userWithLeads.id ? 'Hide' : 'View'} Leads
                          </Button>
                        </div>
                        
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-primary/5 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <UsersIcon className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-primary">Total Leads</span>
                            </div>
                            <p className="text-2xl font-bold">{userWithLeads.leads.length}</p>
                          </div>
                          
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Activity className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Active</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{userWithLeads.activeLeads}</p>
                          </div>
                          
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Building className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">Converted</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{userWithLeads.convertedLeads}</p>
                          </div>
                          
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-600">Total Value</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">
                              {formatCurrency(userWithLeads.totalLeadValue)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Lead Details */}
                        {selectedUser === userWithLeads.id && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3">Lead Details</h4>
                            {userWithLeads.leads.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No leads found for this user.</p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {userWithLeads.leads.map((lead) => (
                                  <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div>
                                      <p className="font-medium">{lead.contact_entity?.name || 'Unnamed Lead'}</p>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{lead.contact_entity?.business_name || 'No business name'}</span>
                                        <span>{lead.contact_entity?.loan_type || 'Unknown type'}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant={lead.contact_entity?.stage === 'Loan Funded' ? 'default' : 'secondary'}>
                                        {lead.contact_entity?.stage || 'No stage'}
                                      </Badge>
                                      <p className="text-sm font-medium text-primary mt-1">
                                        {formatCurrency(lead.contact_entity?.loan_amount || 0)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </TooltipProvider>
  )
}