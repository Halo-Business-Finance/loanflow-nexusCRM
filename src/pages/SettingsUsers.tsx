import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Settings, Shield, Search, Edit3, Trash2, RotateCcw, UserCheck } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function SettingsUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (hasRole('admin') || hasRole('super_admin')) {
      fetchUsers()
    } else {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to view this page",
        variant: "destructive"
      })
      navigate('/leads')
    }
  }, [user, hasRole, navigate])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // For admin users, use the edge function to bypass RLS issues
      if (hasRole('admin') || hasRole('super_admin')) {
        // Get the current session token
        const { data: session } = await supabase.auth.getSession()
        if (!session?.session?.access_token) {
          throw new Error('No access token available')
        }

        const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke('admin-get-users', {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`
          }
        })

        if (edgeError) {
          throw new Error(`Failed to fetch users via admin function: ${edgeError.message}`)
        }

        if (edgeResponse?.users) {
          const transformedUsers = edgeResponse.users.map((profile: any) => ({
            ...profile,
            user_id: profile.id,
            phone: profile.phone_number || '',
            role: profile.role || 'agent'
          }))
          
          setUsers(transformedUsers)
          return
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users: " + (error as Error).message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshUserData = () => {
    fetchUsers()
  }

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'admin': return 'default'
      case 'manager': return 'secondary'
      default: return 'outline'
    }
  }

  const formatUserName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.first_name || user.email
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-gray-600'
  }

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive'
  }

  // Calculate statistics
  const totalUsers = users.length
  const adminCount = users.filter(u => ['admin', 'super_admin'].includes(u.role)).length
  const activeUsers = users.filter(u => u.is_active).length
  const inactiveUsers = totalUsers - activeUsers

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshUserData}
            disabled={loading}
            size="sm"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate('/settings/users')}>
            <UserCheck className="h-4 w-4 mr-2" />
            Full User Management
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              Admin privileges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Settings className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Manage all user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 font-medium text-sm border-b pb-2">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            
            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading users...</div>
              </div>
            )}

            {/* Users List */}
            {!loading && filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">No users found</div>
              </div>
            )}

            {!loading && filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-6 gap-4 text-sm p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {user.first_name?.charAt(0) || user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{formatUserName(user)}</span>
                </div>
                <span className="text-muted-foreground">{user.email}</span>
                <Badge variant={getRoleBadgeVariant(user.role)} className="w-fit">
                  {user.role.replace('_', ' ')}
                </Badge>
                <span className={getStatusColor(user.is_active)}>
                  {getStatusText(user.is_active)}
                </span>
                <span className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('Edit button clicked for user:', user.id);
                    try {
                      navigate(`/settings/users?edit=${user.id}`);
                      console.log('Navigation attempted to:', `/settings/users?edit=${user.id}`);
                    } catch (error) {
                      console.error('Navigation error:', error);
                      toast({
                        title: "Navigation Error",
                        description: "Failed to navigate to edit page",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Manage role definitions and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Super Administrator</p>
                  <p className="text-sm text-muted-foreground">Full system access and control</p>
                </div>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-sm text-muted-foreground">System administration access</p>
                </div>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Manager</p>
                  <p className="text-sm text-muted-foreground">Team and lead management</p>
                </div>
                <Button size="sm" variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Agent</p>
                  <p className="text-sm text-muted-foreground">Basic user access</p>
                </div>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>User activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Active Users Today</p>
                  <p className="text-sm text-muted-foreground">Users who logged in today</p>
                </div>
                <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Total Roles</p>
                  <p className="text-sm text-muted-foreground">Different user roles</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(users.map(u => u.role)).size}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">User Growth</p>
                  <p className="text-sm text-muted-foreground">New users this month</p>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => {
                    const created = new Date(u.created_at)
                    const now = new Date()
                    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                    return created >= thisMonth
                  }).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}