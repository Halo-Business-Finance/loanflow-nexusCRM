import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Users, Eye, Activity, AlertTriangle, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import Layout from '../Layout'

interface AuditLog {
  id: string
  action: string
  table_name: string
  created_at: string
  user_id: string
}

interface UserRole {
  id: string
  user_id: string
  role: string
  assigned_at: string
  is_active: boolean
}

interface UserSession {
  id: string
  user_id: string
  ip_address: string | null
  user_agent: string | null
  last_activity: string
  created_at: string
  is_active: boolean
}

export function SecurityDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const { hasRole } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (hasRole('admin')) {
      fetchSecurityData()
    }
  }, [hasRole])

  const fetchSecurityData = async () => {
    try {
      const [auditResponse, rolesResponse, sessionsResponse] = await Promise.all([
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('user_roles').select('*').order('assigned_at', { ascending: false }),
        supabase.from('user_sessions').select('*').order('last_activity', { ascending: false })
      ])

      if (auditResponse.data) setAuditLogs(auditResponse.data)
      if (rolesResponse.data) setUserRoles(rolesResponse.data)
      if (sessionsResponse.data) setUserSessions(sessionsResponse.data as UserSession[])
    } catch (error) {
      console.error('Error fetching security data:', error)
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cleanupExpiredSessions = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions')
      
      if (error) throw error

      toast({
        title: "Sessions Cleaned",
        description: `Removed ${data} expired sessions`,
      })
      
      fetchSecurityData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (!hasRole('admin')) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">You need admin privileges to view this dashboard.</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading security dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage system security</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              System Secure
            </Badge>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userRoles.filter(r => r.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userSessions.filter(s => s.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Level</CardTitle>
              <Shield className="w-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">High</div>
            </CardContent>
          </Card>
        </div>

        {/* Security Details */}
        <Tabs defaultValue="audit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="users">User Roles</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Logs</CardTitle>
                <CardDescription>System activity and security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.table_name} • {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{log.action.split('_')[0]}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>Manage user permissions and access levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userRoles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">User ID: {role.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Assigned: {new Date(role.assigned_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>
                          {role.role}
                        </Badge>
                        {role.is_active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Monitor user sessions and activity</CardDescription>
                </div>
                <Button onClick={cleanupExpiredSessions} variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clean Expired
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userSessions.filter(s => s.is_active).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">User ID: {session.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          IP: {session.ip_address} • Last activity: {new Date(session.last_activity).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}