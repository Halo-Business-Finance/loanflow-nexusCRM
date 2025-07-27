import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface EmailSetupProps {
  trigger: React.ReactNode
}

interface EmailAccount {
  id: string
  user_id: string
  email_address: string
  display_name: string
  access_token: string
  refresh_token: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function EmailSetup({ trigger }: EmailSetupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [emailAccount, setEmailAccount] = useState<EmailAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadEmailAccount()
    }
  }, [isOpen])

  const loadEmailAccount = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setEmailAccount(data)
    } catch (error: any) {
      console.error('Error loading email account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftConnect = async () => {
    try {
      setIsConnecting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Call edge function to get Microsoft OAuth URL
      const { data, error } = await supabase.functions.invoke('microsoft-auth', {
        body: { action: 'get_auth_url' }
      })

      if (error) throw error

      // Redirect to Microsoft OAuth
      window.location.href = data.auth_url
      
    } catch (error: any) {
      console.error('Error connecting to Microsoft:', error)
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to Microsoft 365",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      
      const { error } = await supabase
        .from('email_accounts')
        .update({ is_active: false })
        .eq('id', emailAccount?.id)

      if (error) throw error

      setEmailAccount(null)
      toast({
        title: "Disconnected",
        description: "Microsoft 365 email account disconnected successfully",
      })
    } catch (error: any) {
      console.error('Error disconnecting account:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Account Setup
          </DialogTitle>
          <DialogDescription>
            Connect your Microsoft 365 work email to send emails directly from the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : emailAccount ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Connected Account</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="w-3 h-3" />
                    Active
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{emailAccount.display_name}</p>
                  <p className="text-xs text-muted-foreground">{emailAccount.email_address}</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Disconnect Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Microsoft 365</CardTitle>
                <CardDescription className="text-xs">
                  Connect your work email account to send emails through Microsoft Graph API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleMicrosoftConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Connect Microsoft 365
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}