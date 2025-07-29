import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Mail, 
  Phone, 
  Globe, 
  Save,
  Upload,
  Key,
  Copy,
  Check
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

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

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    job_title: '',
    language: 'en-US',
    timezone: 'America/New_York'
  })
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    new_application_alerts: true,
    status_change_notifications: true,
    daily_summary_reports: false
  })
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [showMfaDialog, setShowMfaDialog] = useState(false)
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          phone_number: data.phone_number || '',
          job_title: data.job_title || '',
          language: (data as any).language || 'en-US',
          timezone: (data as any).timezone || 'America/New_York'
        })
        
        // Load notification settings
        setNotifications({
          email_notifications: (data as any).email_notifications ?? true,
          new_application_alerts: (data as any).new_application_alerts ?? true,
          status_change_notifications: (data as any).status_change_notifications ?? true,
          daily_summary_reports: (data as any).daily_summary_reports ?? false
        })
      } else {
        // Create profile if it doesn't exist
        setProfile({
          first_name: '',
          last_name: '',
          email: user.email || '',
          phone_number: '',
          job_title: '',
          language: 'en-US',
          timezone: 'America/New_York'
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    }
  }

  const saveProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone_number: profile.phone_number,
          job_title: profile.job_title,
          language: profile.language,
          timezone: profile.timezone,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: field === 'phone_number' ? formatPhoneNumber(value) : value
    }))
  }

  const handleNotificationChange = async (field: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Save to database
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            [field]: value,
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
        
        toast({
          title: "Notification Updated",
          description: `${field.replace(/_/g, ' ')} ${value ? 'enabled' : 'disabled'}`
        })
      } catch (error) {
        console.error('Error saving notification setting:', error)
        // Revert the state change if save failed
        setNotifications(prev => ({
          ...prev,
          [field]: !value
        }))
        toast({
          title: "Error",
          description: "Failed to update notification setting",
          variant: "destructive"
        })
      }
    }
  }

  const setupMFA = async () => {
    try {
      // In a real implementation, this would call your backend to generate MFA secret
      const secret = 'JBSWY3DPEHPK3PXP' // This should come from your backend
      const qrCodeUrl = `otpauth://totp/YourApp:${profile.email}?secret=${secret}&issuer=YourApp`
      
      setMfaSecret(secret)
      setMfaQrCode(qrCodeUrl)
      setShowMfaDialog(true)
    } catch (error) {
      console.error('Error setting up MFA:', error)
      toast({
        title: "Error",
        description: "Failed to set up two-factor authentication",
        variant: "destructive"
      })
    }
  }

  const enableMFA = async () => {
    try {
      // In a real implementation, this would verify the TOTP code and enable MFA
      setMfaEnabled(true)
      setShowMfaDialog(false)
      
      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled"
      })
    } catch (error) {
      console.error('Error enabling MFA:', error)
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication",
        variant: "destructive"
      })
    }
  }

  const disableMFA = async () => {
    try {
      // In a real implementation, this would call your backend to disable MFA
      setMfaEnabled(false)
      
      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled"
      })
    } catch (error) {
      console.error('Error disabling MFA:', error)
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication",
        variant: "destructive"
      })
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(mfaSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    toast({
      title: "Copied",
      description: "Secret key copied to clipboard"
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and system configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/api/placeholder/80/80" />
                    <AvatarFallback>
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Change Avatar
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profile.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profile.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={profile.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      placeholder="(555) 123-4567" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input 
                    id="title" 
                    value={profile.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                  />
                </div>

                <Button 
                  className="bg-gradient-primary gap-2" 
                  onClick={saveProfile}
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about applications
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email_notifications}
                      onCheckedChange={(value) => handleNotificationChange('email_notifications', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>New Application Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new applications are submitted
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.new_application_alerts}
                      onCheckedChange={(value) => handleNotificationChange('new_application_alerts', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Status Change Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Alerts for application status updates
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.status_change_notifications}
                      onCheckedChange={(value) => handleNotificationChange('status_change_notifications', value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Daily Summary Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Daily digest of activities and metrics
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.daily_summary_reports}
                      onCheckedChange={(value) => handleNotificationChange('daily_summary_reports', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Change Password</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <Input type="password" placeholder="Current password" />
                      <Input type="password" placeholder="New password" />
                    </div>
                    <Button variant="outline" className="mt-2">
                      Update Password
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                      {mfaEnabled && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Enabled</span>
                        </div>
                      )}
                    </div>
                    {mfaEnabled ? (
                      <Button variant="outline" onClick={disableMFA}>
                        Disable 2FA
                      </Button>
                    ) : (
                      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={setupMFA}>
                            <Key className="h-4 w-4 mr-2" />
                            Enable 2FA
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
                            <DialogDescription>
                              Scan the QR code with your authenticator app or enter the secret key manually
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* QR Code placeholder */}
                            <div className="flex justify-center">
                              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                                <p className="text-sm text-muted-foreground text-center">
                                  QR Code would appear here<br />
                                  (Use secret key for now)
                                </p>
                              </div>
                            </div>
                            
                            {/* Secret Key */}
                            <div className="space-y-2">
                              <Label>Secret Key</Label>
                              <div className="flex gap-2">
                                <Input value={mfaSecret} readOnly className="font-mono text-sm" />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={copySecret}
                                  className="shrink-0"
                                >
                                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            
                            {/* Verification Code Input */}
                            <div className="space-y-2">
                              <Label>Enter verification code from your app</Label>
                              <Input placeholder="000000" maxLength={6} />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button onClick={enableMFA} className="flex-1">
                                Enable 2FA
                              </Button>
                              <Button variant="outline" onClick={() => setShowMfaDialog(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Settings Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Plan</span>
                  <Badge variant="default">Professional</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage Used</span>
                  <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Users</span>
                  <span className="text-sm font-medium">4 / 25</span>
                </div>
                <Button variant="outline" className="w-full">
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>

            {/* System Preferences */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select 
                    value={theme} 
                    onValueChange={(value) => {
                      setTheme(value)
                      toast({
                        title: "Theme Updated",
                        description: `Theme changed to ${value === 'system' ? 'system default' : value}`
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="light" className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">Light</SelectItem>
                      <SelectItem value="dark" className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred theme or use system default
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={profile.language} 
                    onValueChange={(value) => handleInputChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español (Spanish)</SelectItem>
                      <SelectItem value="fr-FR">Français (French)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select 
                    value={profile.timezone} 
                    onValueChange={(value) => handleInputChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                      <SelectItem value="America/Anchorage">Alaska Time (US)</SelectItem>
                      <SelectItem value="Pacific/Honolulu">Hawaii Time (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Database className="h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  Email Support
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Globe className="h-4 w-4" />
                  System Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}