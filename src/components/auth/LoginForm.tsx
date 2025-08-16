import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, Shield } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/integrations/supabase/client'

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
    console.log('Microsoft button clicked!')
    console.log('Button disabled state:', isMicrosoftLoading || isLoading)
    console.log('Current URL origin:', window.location.origin)
    
    setIsMicrosoftLoading(true)
    
    try {
      console.log('Attempting Microsoft OAuth...')
      
      // Check current session first
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('Current session before OAuth:', sessionData.session?.user?.email || 'No session')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email',
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      
      console.log('OAuth response:', { data, error })
      
      if (error) {
        console.error('OAuth error details:', error)
        alert(`Microsoft login failed: ${error.message}\n\nPlease check:\n1. Azure App Registration redirect URI: https://gshxxsniwytjgcnthyfq.supabase.co/auth/v1/callback\n2. Web platform configured in Azure\n3. ID tokens enabled under Authentication`)
        setIsMicrosoftLoading(false)
        return
      }
      
      if (data?.url) {
        console.log('Redirecting to OAuth URL:', data.url)
        window.location.href = data.url
      } else {
        console.log('No redirect URL received from OAuth')
        setIsMicrosoftLoading(false)
      }
    } catch (error) {
      console.error('Microsoft sign in error:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsMicrosoftLoading(false)
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
        {/* Microsoft 365 Sign In - Primary Option */}
        <div className="space-y-4">
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleMicrosoftSignIn()
            }}
            disabled={isMicrosoftLoading || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isMicrosoftLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
              <path fill="#ffffff" d="M1 1h10v10H1z"/>
              <path fill="#ffffff" d="M12 1h10v10H12z"/>
              <path fill="#ffffff" d="M1 12h10v10H1z"/>
              <path fill="#ffffff" d="M12 12h10v10H12z"/>
            </svg>
            Sign in with Microsoft 365
          </Button>
        </div>

        {/* Divider */}
        <div className="my-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        {/* Email/Password Form */}
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
          <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In with Email
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={onToggleMode}
            className="text-sm text-muted-foreground"
          >
            Don't have an account? Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}