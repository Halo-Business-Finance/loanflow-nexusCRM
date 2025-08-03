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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
  User,
  Key,
  Archive,
  RotateCcw
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
  role: 'super_admin' | 'admin' | 'manager' | 'agent' | 'funder' | 'loan_processor' | 'underwriter' | 'viewer'
  is_active: boolean
  archived_at?: string | null
  archived_by?: string | null
  archive_reason?: string | null
}

export default function Users() {
  const { hasRole, user: currentUser, userRole: currentUserRole } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [archivedUsers, setArchivedUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [archiveReason, setArchiveReason] = useState("")
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [userToArchive, setUserToArchive] = useState<UserProfile | null>(null)
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "agent" as 'super_admin' | 'admin' | 'manager' | 'agent' | 'funder' | 'loan_processor' | 'underwriter' | 'viewer'
  })
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showNewUserDialog, setShowNewUserDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordChangeUser, setPasswordChangeUser] = useState<UserProfile | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (hasRole('admin') || hasRole('super_admin')) {
      fetchUsers()
      fetchArchivedUsers()
    } else {
      setLoading(false)
    }
  }, [hasRole])

  // Redirect if not admin or super_admin
  if (!hasRole('admin') && !hasRole('super_admin')) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
          email,
          created_at,
          archived_at,
          archived_by,
          archive_reason
        `)
        .is('archived_at', null)

      if (profilesError) throw profilesError

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active')

      if (rolesError) throw rolesError

      // Combine the data - only show users with active roles and existing profiles (not archived)
      const combinedUsers: UserProfile[] = profiles
        .map(profile => {
          const role = roles.find(r => r.user_id === profile.id && r.is_active === true)
          
          if (!role || profile.archived_at) return null // Skip users without active roles or archived users
          
          return {
            ...profile,
            email: profile.email || '',
            role: role.role || 'agent',
            is_active: role.is_active || false,
            archived_at: profile.archived_at,
            archived_by: profile.archived_by,
            archive_reason: profile.archive_reason
          }
        })
        .filter(Boolean) as UserProfile[] // Remove null entries

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

  const fetchArchivedUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone_number,
          email,
          created_at,
          archived_at,
          archived_by,
          archive_reason
        `)
        .not('archived_at', 'is', null)

      if (profilesError) throw profilesError

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active')

      if (rolesError) throw rolesError

      // Combine the data for archived users
      const combinedArchivedUsers: UserProfile[] = profiles
        .map(profile => {
          const role = roles.find(r => r.user_id === profile.id)
          
          if (!role) return null
          
          return {
            ...profile,
            email: profile.email || '',
            role: role.role || 'agent',
            is_active: role.is_active || false,
            archived_at: profile.archived_at,
            archived_by: profile.archived_by,
            archive_reason: profile.archive_reason
          }
        })
        .filter(Boolean) as UserProfile[]

      setArchivedUsers(combinedArchivedUsers)
    } catch (error) {
      console.error('Error fetching archived users:', error)
    }
  }

  const archiveUser = async () => {
    if (!userToArchive) return

    try {
      const { error } = await supabase.rpc('archive_user', {
        p_user_id: userToArchive.id,
        p_reason: archiveReason || 'User archived by administrator'
      })

      if (error) throw error

      toast({
        title: "Success",
        description: `User ${userToArchive.first_name} ${userToArchive.last_name} has been archived`
      })

      setShowArchiveDialog(false)
      setUserToArchive(null)
      setArchiveReason("")
      fetchUsers()
      fetchArchivedUsers()
    } catch (error) {
      console.error('Error archiving user:', error)
      toast({
        title: "Error",
        description: "Failed to archive user",
        variant: "destructive"
      })
    }
  }

  const restoreUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc('restore_user', {
        p_user_id: userId
      })

      if (error) throw error

      toast({
        title: "Success",
        description: `User ${userName} has been restored from archive`
      })

      fetchUsers()
      fetchArchivedUsers()
    } catch (error) {
      console.error('Error restoring user:', error)
      toast({
        title: "Error",
        description: "Failed to restore user",
        variant: "destructive"
      })
    }
  }

  const createUser = async () => {
    console.log('Starting user creation with data:', newUser)
    
    try {
      // Check if trying to create super_admin without being super_admin
      if (newUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "Only super administrators can create other super administrators",
          variant: "destructive"
        })
        return
      }

      // Check if trying to create admin without being super_admin or admin
      if (newUser.role === 'admin' && currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
        toast({
          title: "Access Denied",
          description: "Only super administrators or administrators can create other administrators",
          variant: "destructive"
        })
        return
      }

      console.log('Attempting to sign up user...')
      
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

      console.log('Signup result:', { data, error })

      if (error) throw error
      if (!data.user) throw new Error('Failed to create user')

      // The profile will be created automatically by the trigger
      // The trigger also creates a default 'agent' role, so we need to update it if different
      console.log('Updating user role to:', newUser.role)
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: newUser.role })
        .eq('user_id', data.user.id)
        .eq('is_active', true)

      if (roleError) {
        console.error('Role update error:', roleError)
        throw roleError
      }

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
      // Check if trying to assign super_admin role without being super_admin
      if (editingUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "Only super administrators can assign the super administrator role",
          variant: "destructive"
        })
        return
      }

      // Check if trying to assign admin role without being super_admin or admin
      if (editingUser.role === 'admin' && currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
        toast({
          title: "Access Denied",
          description: "Only super administrators or administrators can assign the administrator role",
          variant: "destructive"
        })
        return
      }

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

      // Update role - Delete existing active roles, then insert the new one
      // Step 1: Delete all active roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id)
        .eq('is_active', true)

      if (deleteError) {
        console.error('Error deleting existing active roles:', deleteError)
        throw deleteError
      }

      // Step 2: Insert the new active role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: editingUser.id,
          role: editingUser.role,
          is_active: true
        })
        .select()

      console.log('Role insert result:', { roleData, roleError })

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
      console.log('Starting user deletion for:', userId, userEmail)
      
      // First, delete associated data
      // Delete user roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      console.log('Role deletion result:', { roleError })
      if (roleError) throw roleError

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      console.log('Profile deletion result:', { profileError })
      if (profileError) throw profileError

      // Delete user sessions
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)

      console.log('Session deletion result:', { sessionError })
      if (sessionError) throw sessionError

      // Delete notifications
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      console.log('Notification deletion result:', { notificationError })
      if (notificationError) throw notificationError

      // Note: We cannot delete from auth.users table directly through the client
      // The user's auth record will remain but they won't be able to access the system
      // without the associated profile and role records

      console.log('User deletion completed successfully')
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

  const changeUserPassword = async () => {
    if (!passwordChangeUser) return

    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      })
      return
    }

    try {
      // Use admin functions to update user password
      const { error } = await supabase.auth.admin.updateUserById(
        passwordChangeUser.id,
        { password: newPassword }
      )

      if (error) throw error

      toast({
        title: "Success",
        description: `Password updated successfully for ${passwordChangeUser.first_name} ${passwordChangeUser.last_name}`
      })

      // Reset form and close dialog
      setNewPassword("")
      setConfirmPassword("")
      setPasswordChangeUser(null)
      setShowPasswordDialog(false)
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
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
      case 'super_admin': return 'default'
      case 'admin': return 'default'
      case 'manager': return 'default'
      case 'agent': return 'secondary'
      case 'funder': return 'secondary'
      case 'loan_processor': return 'secondary'
      case 'underwriter': return 'secondary'
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
            <p className="text-white">Manage loan originators and team members</p>
          </div>
          
          <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4 text-white" />
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
                      {currentUserRole === 'super_admin' && (
                        <SelectItem value="super_admin">Super Administrator</SelectItem>
                      )}
                      {(currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
                        <SelectItem value="admin">Administrator</SelectItem>
                      )}
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Loan Originator (Agent)</SelectItem>
                      <SelectItem value="funder">Funder</SelectItem>
                      <SelectItem value="loan_processor">Processor</SelectItem>
                      <SelectItem value="underwriter">Underwriter</SelectItem>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-white">
                <UsersIcon className="h-4 w-4 text-white" />
                {filteredUsers.length} users
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-white" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Users ({users.length})</TabsTrigger>
                <TabsTrigger value="archived">Archived Users ({archivedUsers.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-white">User</th>
                        <th className="text-left py-3 px-4 font-medium text-white">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-white">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-white">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          {/* User Column */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                               <Avatar className="h-10 w-10">
                                 <AvatarFallback className="bg-primary/10 text-white font-medium">
                                   {user.first_name?.[0]}{user.last_name?.[0]}
                                 </AvatarFallback>
                               </Avatar>
                              <div>
                                <p className="font-medium text-foreground">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-white">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact Column */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {user.phone_number ? (
                                <PhoneDialer 
                                  trigger={
                                    <button className="flex items-center gap-2 text-sm text-white hover:text-primary transition-colors">
                                      <Phone className="h-4 w-4 text-white" />
                                      {user.phone_number}
                                    </button>
                                  }
                                />
                              ) : (
                                <span className="text-sm text-white">No phone</span>
                              )}
                              <div className="flex items-center gap-2 text-sm text-white">
                                <Calendar className="h-4 w-4 text-white" />
                                {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="py-4 px-4">
                            <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                              {user.role === 'super_admin' ? 'Super Administrator' : 
                               user.role === 'admin' ? 'Admin' :
                               user.role === 'manager' ? 'Manager' :
                               user.role === 'agent' ? 'Agent' :
                               user.role === 'funder' ? 'Funder' :
                               user.role === 'loan_processor' ? 'Processor' :
                               user.role === 'underwriter' ? 'Underwriter' : 'Viewer'}
                            </Badge>
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className={`text-sm font-medium ${user.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user)
                                  setShowEditDialog(true)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4 text-white" />
                              </Button>
                              
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setPasswordChangeUser(user)
                                  setShowPasswordDialog(true)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Key className="h-4 w-4 text-white" />
                              </Button>

                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                className="h-8 w-8 p-0"
                              >
                                {user.is_active ? <Shield className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                              </Button>

                              {user.email !== currentUser?.email && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setUserToArchive(user)
                                      setShowArchiveDialog(true)
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Archive className="h-4 w-4 text-white" />
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to permanently delete <strong>{user.first_name} {user.last_name}</strong> ({user.email})? 
                                          This will remove all their data including profile, roles, sessions, and notifications. This action cannot be undone.
                                          <br /><br />
                                          <strong>Tip:</strong> Consider archiving the user instead, which allows you to restore them later.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteUser(user.id, user.email)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Permanently Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No active users found matching your search.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="archived" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-white">User</th>
                        <th className="text-left py-3 px-4 font-medium text-white">Archived Date</th>
                        <th className="text-left py-3 px-4 font-medium text-white">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-white">Reason</th>
                        <th className="text-right py-3 px-4 font-medium text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors opacity-75">
                          {/* User Column */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                               <Avatar className="h-10 w-10">
                                 <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                                   {user.first_name?.[0]}{user.last_name?.[0]}
                                 </AvatarFallback>
                               </Avatar>
                              <div>
                                <p className="font-medium text-muted-foreground">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Archived Date Column */}
                          <td className="py-4 px-4">
                            <div className="text-sm text-muted-foreground">
                              {user.archived_at ? new Date(user.archived_at).toLocaleDateString() : 'Unknown'}
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="py-4 px-4">
                            <Badge variant="outline" className="capitalize">
                              {user.role === 'super_admin' ? 'Super Administrator' : 
                               user.role === 'admin' ? 'Admin' :
                               user.role === 'manager' ? 'Manager' :
                               user.role === 'agent' ? 'Agent' :
                               user.role === 'funder' ? 'Funder' :
                               user.role === 'loan_processor' ? 'Processor' :
                               user.role === 'underwriter' ? 'Underwriter' : 'Viewer'}
                            </Badge>
                          </td>

                          {/* Reason Column */}
                          <td className="py-4 px-4">
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {user.archive_reason || 'No reason provided'}
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restoreUser(user.id, `${user.first_name} ${user.last_name}`)}
                                className="h-8 px-3"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restore
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {archivedUsers.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No archived users found.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
                      {currentUserRole === 'super_admin' && (
                        <SelectItem value="super_admin">Super Administrator</SelectItem>
                      )}
                      {(currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
                        <SelectItem value="admin">Administrator</SelectItem>
                      )}
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Loan Originator (Agent)</SelectItem>
                      <SelectItem value="funder">Funder</SelectItem>
                      <SelectItem value="loan_processor">Processor</SelectItem>
                      <SelectItem value="underwriter">Underwriter</SelectItem>
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

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            {passwordChangeUser && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Changing password for:
                  </p>
                  <p className="font-semibold">
                    {passwordChangeUser.first_name} {passwordChangeUser.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {passwordChangeUser.email}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Password must be at least 8 characters long. The user will need to use this new password for their next login.
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={changeUserPassword} 
                    className="flex-1"
                    disabled={!newPassword || !confirmPassword}
                  >
                    <Key className="h-4 w-4 mr-2 text-primary-foreground" />
                    Change Password
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordDialog(false)
                      setNewPassword("")
                      setConfirmPassword("")
                      setPasswordChangeUser(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Archive User Dialog */}
        <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Archive User</DialogTitle>
            </DialogHeader>
            {userToArchive && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    You are about to archive:
                  </p>
                  <p className="font-semibold">
                    {userToArchive.first_name} {userToArchive.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userToArchive.email}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="archiveReason">Reason for archiving (optional)</Label>
                  <Textarea
                    id="archiveReason"
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    placeholder="Enter reason for archiving this user..."
                    rows={3}
                  />
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Archiving will deactivate the user and move them to the archived users section. 
                    You can restore them later if needed. This is a safer alternative to permanent deletion.
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={archiveUser} 
                    className="flex-1"
                    variant="secondary"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive User
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowArchiveDialog(false)
                      setArchiveReason("")
                      setUserToArchive(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}