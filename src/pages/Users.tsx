import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  User
} from "lucide-react"

// Phone number formatting function
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '')
  
  // Format based on length
  if (phoneNumber.length < 4) {
    return phoneNumber
  } else if (phoneNumber.length < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }
}

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  created_at: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  is_active: boolean
}

export default function Users() {
  const { hasRole, user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "agent" as const
  })
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showNewUserDialog, setShowNewUserDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    if (hasRole('admin')) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [hasRole])

  // Redirect if not admin
  if (!hasRole('admin')) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access user management.</p>
          </div>
        </div>
      </Layout>
    )
  }

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone_number,
          created_at
        `)

      if (profilesError) throw profilesError

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active')

      if (rolesError) throw rolesError

      // Get auth users data - Note: Admin functions may not be available in all environments
      let authUsers: any[] = []
      try {
        const { data, error: authError } = await supabase.auth.admin.listUsers()
        if (data?.users) {
          authUsers = data.users
        }
      } catch (error) {
        console.log('Admin functions not available, using profile data only')
      }

      // Combine the data
      const combinedUsers: UserProfile[] = profiles.map(profile => {
        const role = roles.find(r => r.user_id === profile.id)
        const authUser = authUsers.find((u: any) => u.id === profile.id)
        
        return {
          ...profile,
          email: authUser?.email || '',
          role: role?.role || 'agent',
          is_active: role?.is_active || false
        }
      })

      setUsers(combinedUsers)
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

  const createUser = async () => {
    try {
      // Sign up the user first
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            phone_number: newUser.phone_number // Include phone in signup metadata
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      })

      if (error) throw error
      if (!data.user) throw new Error('Failed to create user')

      // The profile will be created automatically by the trigger
      // Just need to assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: newUser.role
        })

      if (roleError) throw roleError

      // Update the profile with phone number (in case trigger didn't handle it)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone_number: newUser.phone_number })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('Phone number update error:', profileError)
        // Don't throw error here as user creation was successful
      }

      toast({
        title: "Success",
        description: "User created successfully"
      })

      setNewUser({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        role: "agent"
      })
      setShowNewUserDialog(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      
      let errorMessage = "Failed to create user"
      
      // Handle specific error types
      if (error.code === 'weak_password') {
        errorMessage = "Password is too weak or has been found in data breaches. Please choose a stronger, unique password with at least 8 characters, including uppercase, lowercase, numbers, and symbols."
      } else if (error.code === 'email_address_not_authorized') {
        errorMessage = "This email address is not authorized to sign up."
      } else if (error.code === 'signup_disabled') {
        errorMessage = "User registration is currently disabled."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const updateUser = async () => {
    if (!editingUser) return

    try {
      console.log('Updating user with data:', {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        phone_number: editingUser.phone_number,
        user_id: editingUser.id
      })

      // Update profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          phone_number: editingUser.phone_number
        })
        .eq('id', editingUser.id)
        .select()

      console.log('Profile update result:', { profileData, profileError })

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw profileError
      }

      // Update role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .update({ role: editingUser.role })
        .eq('user_id', editingUser.id)
        .select()

      console.log('Role update result:', { roleData, roleError })

      if (roleError) {
        console.error('Role update error:', roleError)
        throw roleError
      }

      toast({
        title: "Success",
        description: "User updated successfully"
      })

      setShowEditDialog(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    try {
      // First, delete associated data
      // Delete user roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (roleError) throw roleError

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Delete user sessions
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)

      if (sessionError) throw sessionError

      // Delete notifications
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (notificationError) throw notificationError

      // Note: We cannot delete from auth.users table directly through the client
      // The user's auth record will remain but they won't be able to access the system
      // without the associated profile and role records

      toast({
        title: "Success!",
        description: `User ${userEmail} has been deleted successfully.`,
      })

      fetchUsers() // Refresh the users list
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId)

      if (error) throw error

      toast({
        title: "Success",
        description: `User ${currentStatus ? 'deactivated' : 'activated'} successfully`
      })

      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'manager': return 'default'
      case 'agent': return 'secondary'
      case 'viewer': return 'outline'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
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
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage loan originators and team members</p>
          </div>
          
          <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter a strong password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols. Avoid common passwords.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newUser.phone_number}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      setNewUser({...newUser, phone_number: formatted})
                    }}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value: any) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Loan Originator (Agent)</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={createUser} className="flex-1">Create User</Button>
                  <Button variant="outline" onClick={() => setShowNewUserDialog(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                {filteredUsers.length} users
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {user.phone_number && (
                    <PhoneDialer 
                      trigger={
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="h-4 w-4" />
                          {user.phone_number}
                        </button>
                      }
                    />
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Status: {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingUser(user)
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={user.is_active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  {user.email !== currentUser?.email && ( // Prevent self-deletion
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{user.first_name} {user.last_name}</strong> ({user.email})? 
                            This will remove all their data including profile, roles, sessions, and notifications. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.id, user.email)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={editingUser.first_name || ''}
                      onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={editingUser.last_name || ''}
                      onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone Number</Label>
                  <Input
                    id="editPhone"
                    value={editingUser.phone_number || ''}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      setEditingUser({...editingUser, phone_number: formatted})
                    }}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: any) => setEditingUser({...editingUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Loan Originator (Agent)</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={updateUser} className="flex-1">Update User</Button>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}