import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, Shield } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      // Error handling is done in the AuthProvider
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    console.log('🚀 Starting Microsoft OAuth flow...')
    setIsMicrosoftLoading(true)
    
    try {
      // Clear any existing auth state
      console.log('📝 Clearing existing auth state...')
      
      // Get current origin for redirect
      const redirectUrl = `${window.location.origin}/`
      console.log('🔗 Redirect URL:', redirectUrl)
      
      // Start OAuth flow with comprehensive logging
      console.log('🔐 Initiating OAuth with Azure provider...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email',
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      })
      
      console.log('📊 OAuth Response:', { data, error })
      
      if (error) {
        console.error('❌ OAuth Error:', error)
        toast.error(`Microsoft sign-in failed: ${error.message}`)
        return
      }
      
      if (data?.url) {
        console.log('🌐 Redirecting to Microsoft...', data.url)
        // Store intention to prevent loops
        localStorage.setItem('ms_oauth_attempt', Date.now().toString())
        window.location.href = data.url
      } else {
        console.warn('⚠️ No redirect URL received from OAuth')
        toast.error('Microsoft sign-in failed: No redirect URL received')
      }
      
    } catch (error: any) {
      console.error('💥 Microsoft OAuth Error:', error)
      toast.error(`Authentication error: ${error.message || 'Unknown error'}`)
    } finally {
      // Only reset loading if we're not redirecting
      setTimeout(() => setIsMicrosoftLoading(false), 1000)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your secure CRM account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Email/Password Form - Primary and Working Option */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isMicrosoftLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In with Email
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={onToggleMode}
            className="text-sm text-muted-foreground"
            disabled={isLoading || isMicrosoftLoading}
          >
            Don't have an account? Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}