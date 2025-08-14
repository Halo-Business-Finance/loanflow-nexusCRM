import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, AlertTriangle, Eye, Users, Key, Activity, Trash2, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdvancedThreatDetection } from "./AdvancedThreatDetection";
import { SecurityMonitor } from "./SecurityMonitor";
import { DarkWebSecurityBot } from "./DarkWebSecurityBot";
import { HackerDetectionBot } from "./HackerDetectionBot";
import { DataIntegrityDashboard } from "@/components/DataIntegrityDashboard";
import Layout from "@/components/Layout";

interface SecurityNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

interface MFASettings {
  id?: string;
  is_enabled: boolean;
  preferred_method: string;
  phone_number?: string;
}

interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  max_age_days: number;
  prevent_reuse_count: number;
}

// Admin dashboard interfaces
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

export function SecurityManager() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [securityNotifications, setSecurityNotifications] = useState<SecurityNotification[]>([]);
  
  // Admin dashboard state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  
  const [mfaSettings, setMfaSettings] = useState<MFASettings>({
    is_enabled: false,
    preferred_method: 'totp'
  });
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    min_length: 12,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    max_age_days: 90,
    prevent_reuse_count: 5
  });

  useEffect(() => {
    if (user) {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch security notifications
      const { data: notifications } = await supabase
        .from('security_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (notifications) {
        setSecurityNotifications(notifications);
      }

      // Fetch MFA settings
      const { data: mfa } = await supabase
        .from('mfa_settings')
        .select('*')
        .single();

      if (mfa) {
        setMfaSettings({
          id: mfa.id,
          is_enabled: mfa.is_enabled,
          preferred_method: mfa.preferred_method || 'totp',
          phone_number: mfa.phone_number
        });
      }

      // Fetch password policy (admins only)
      if (hasRole('admin')) {
        const { data: policy } = await supabase
          .from('password_policies')
          .select('*')
          .eq('is_active', true)
          .single();

        if (policy) {
          setPasswordPolicy(policy);
        }

        // Fetch admin dashboard data
        const [auditResponse, rolesResponse, sessionsResponse] = await Promise.all([
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('user_roles').select('*').order('assigned_at', { ascending: false }),
          supabase.from('user_sessions').select('*').order('last_activity', { ascending: false })
        ])

        if (auditResponse.data) setAuditLogs(auditResponse.data)
        if (rolesResponse.data) setUserRoles(rolesResponse.data)
        if (sessionsResponse.data) setUserSessions(sessionsResponse.data as UserSession[])
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableMFA = async () => {
    try {
      const { error } = await supabase
        .from('mfa_settings')
        .upsert({
          user_id: user?.id,
          is_enabled: true,
          preferred_method: mfaSettings.preferred_method,
          phone_number: mfaSettings.phone_number
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast({
        title: "MFA Enabled",
        description: "Multi-factor authentication has been enabled for your account.",
      });

      fetchSecurityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disableMFA = async () => {
    try {
      const { error } = await supabase
        .from('mfa_settings')
        .update({ is_enabled: false })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "MFA Disabled",
        description: "Multi-factor authentication has been disabled.",
      });

      fetchSecurityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePasswordPolicy = async () => {
    if (!hasRole('admin')) return;

    try {
      const { error } = await supabase
        .from('password_policies')
        .update(passwordPolicy)
        .eq('is_active', true);

      if (error) throw error;

      toast({
        title: "Password Policy Updated",
        description: "Password policy has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('security_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setSecurityNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold text-foreground">Security Center</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data-integrity">Data Integrity</TabsTrigger>
            <TabsTrigger value="monitor">Security Monitor</TabsTrigger>
            {hasRole('admin') && <TabsTrigger value="threats">AI Protection Bot</TabsTrigger>}
            {hasRole('admin') && <TabsTrigger value="darkweb">Dark Web Bot</TabsTrigger>}
            {hasRole('admin') && <TabsTrigger value="hacker">Hacker Detection Bot</TabsTrigger>}
            <TabsTrigger value="mfa">Multi-Factor Auth</TabsTrigger>
            <TabsTrigger value="notifications">Security Alerts</TabsTrigger>
            {hasRole('admin') && <TabsTrigger value="policies">Password Policy</TabsTrigger>}
            {hasRole('admin') && <TabsTrigger value="audit">Audit Logs</TabsTrigger>}
            {hasRole('admin') && <TabsTrigger value="users">User Roles</TabsTrigger>}
            {hasRole('admin') && <TabsTrigger value="sessions">Active Sessions</TabsTrigger>}
          </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">Secure</div>
                <p className="text-xs text-foreground/70">
                  All security features are active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MFA Status</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {mfaSettings.is_enabled ? 'Enabled' : 'Disabled'}
                </div>
                <p className="text-xs text-foreground/70">
                  {mfaSettings.is_enabled ? 'Two-factor authentication active' : 'Enable for extra security'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {securityNotifications.filter(n => !n.is_read).length}
                </div>
                <p className="text-xs text-foreground/70">
                  Unread security notifications
                </p>
              </CardContent>
            </Card>

            {hasRole('admin') && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{userRoles.filter(r => r.is_active).length}</div>
                  <p className="text-xs text-foreground/70">
                    System-wide user count
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Security Activity</CardTitle>
              <CardDescription>
                Latest security events for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityNotifications.length === 0 ? (
                <p className="text-foreground/70">No recent security activity</p>
              ) : (
                <div className="space-y-2">
                  {securityNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{notification.title}</div>
                        <div className="text-sm text-foreground/70">{notification.message}</div>
                        <div className="text-xs text-foreground/50">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={getSeverityColor(notification.severity)}>
                        {notification.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-integrity" className="space-y-4">
          <DataIntegrityDashboard />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          <SecurityMonitor />
        </TabsContent>

        {hasRole('admin') && (
          <TabsContent value="threats" className="space-y-4">
            <AdvancedThreatDetection />
          </TabsContent>
        )}

        {hasRole('admin') && (
          <TabsContent value="darkweb" className="space-y-4">
            <DarkWebSecurityBot />
          </TabsContent>
        )}

        {hasRole('admin') && (
          <TabsContent value="hacker" className="space-y-4">
            <HackerDetectionBot />
          </TabsContent>
        )}

        <TabsContent value="mfa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                <div>
                  <Label htmlFor="mfa-enabled" className="text-base font-medium text-foreground">Enable MFA</Label>
                  <p className="text-sm text-muted-foreground">
                    Require a second form of authentication when signing in
                  </p>
                </div>
                <Switch
                  id="mfa-enabled"
                  checked={mfaSettings.is_enabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      enableMFA();
                    } else {
                      disableMFA();
                    }
                  }}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                />
              </div>

              {mfaSettings.is_enabled && (
                <div className="space-y-4 p-4 border rounded">
                  <div className="space-y-2">
                    <Label htmlFor="preferred-method">Preferred Method</Label>
                    <select
                      id="preferred-method"
                      className="w-full p-2 border rounded"
                      value={mfaSettings.preferred_method}
                      onChange={(e) => setMfaSettings(prev => ({
                        ...prev,
                        preferred_method: e.target.value
                      }))}
                    >
                      <option value="totp">Authenticator App (TOTP)</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  {mfaSettings.preferred_method === 'sms' && (
                    <div className="space-y-2">
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <Input
                        id="phone-number"
                        type="tel"
                        placeholder="+1234567890"
                        value={mfaSettings.phone_number || ''}
                        onChange={(e) => setMfaSettings(prev => ({
                          ...prev,
                          phone_number: e.target.value
                        }))}
                      />
                    </div>
                  )}

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Make sure you have access to your chosen authentication method before enabling MFA.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Notifications</CardTitle>
              <CardDescription>
                Important security alerts and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityNotifications.length === 0 ? (
                <p className="text-muted-foreground">No security notifications</p>
              ) : (
                <div className="space-y-4">
                  {securityNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded cursor-pointer transition-colors ${
                        notification.is_read ? 'bg-muted/50' : 'bg-background'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{notification.title}</h4>
                            <Badge variant={getSeverityColor(notification.severity)}>
                              {notification.severity}
                            </Badge>
                            {!notification.is_read && (
                              <Badge variant="outline">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasRole('admin') && (
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Password Policy</CardTitle>
                <CardDescription>
                  Configure password requirements for all users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      min="8"
                      max="128"
                      value={passwordPolicy.min_length}
                      onChange={(e) => setPasswordPolicy(prev => ({
                        ...prev,
                        min_length: parseInt(e.target.value)
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-age">Password Age (days)</Label>
                    <Input
                      id="max-age"
                      type="number"
                      min="30"
                      max="365"
                      value={passwordPolicy.max_age_days}
                      onChange={(e) => setPasswordPolicy(prev => ({
                        ...prev,
                        max_age_days: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-uppercase">Require Uppercase Letters</Label>
                    <Switch
                      id="require-uppercase"
                      checked={passwordPolicy.require_uppercase}
                      onCheckedChange={(checked) => setPasswordPolicy(prev => ({
                        ...prev,
                        require_uppercase: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-lowercase">Require Lowercase Letters</Label>
                    <Switch
                      id="require-lowercase"
                      checked={passwordPolicy.require_lowercase}
                      onCheckedChange={(checked) => setPasswordPolicy(prev => ({
                        ...prev,
                        require_lowercase: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-numbers">Require Numbers</Label>
                    <Switch
                      id="require-numbers"
                      checked={passwordPolicy.require_numbers}
                      onCheckedChange={(checked) => setPasswordPolicy(prev => ({
                        ...prev,
                        require_numbers: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-special">Require Special Characters</Label>
                    <Switch
                      id="require-special"
                      checked={passwordPolicy.require_special_chars}
                      onCheckedChange={(checked) => setPasswordPolicy(prev => ({
                        ...prev,
                        require_special_chars: checked
                      }))}
                    />
                  </div>
                </div>

                <Button onClick={updatePasswordPolicy} className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Update Password Policy
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasRole('admin') && (
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
        )}

        {hasRole('admin') && (
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
        )}

        {hasRole('admin') && (
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
        )}

      </Tabs>
      </div>
    </Layout>
  );
}