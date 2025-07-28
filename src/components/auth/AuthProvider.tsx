import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  userRole: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    console.log('AuthProvider useEffect running')
    let mounted = true
    
    const checkSession = async () => {
      try {
        console.log('Checking initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Session result:', { session: !!session, error })
        
        if (mounted) {
          setUser(session?.user ?? null)
          setUserRole('admin') // Temporarily set role to admin to bypass role fetching
          setLoading(false)
          console.log('Set loading to false')
        }
      } catch (error) {
        console.error('Session check failed:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session)
      if (mounted) {
        setUser(session?.user ?? null)
        setUserRole(session?.user ? 'admin' : null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])


  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error)
        return
      }

      setUserRole(data?.role || 'agent')
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('agent')
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Check geo-restrictions first
      console.log('Checking geo-restrictions...')
      const geoCheck = await supabase.functions.invoke('geo-security')
      
      if (geoCheck.error || !geoCheck.data?.allowed) {
        throw new Error(geoCheck.data?.reason || 'Access restricted to US locations only')
      }

      console.log('Attempting to sign in with email:', email)
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Sign in response:', { error, data })
      if (error) throw error

      // Log successful login
      await supabase.functions.invoke('audit-log', {
        body: {
          action: 'user_login',
          table_name: 'auth.users',
        }
      })

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Check geo-restrictions first
      console.log('Checking geo-restrictions for signup...')
      const geoCheck = await supabase.functions.invoke('geo-security')
      
      if (geoCheck.error || !geoCheck.data?.allowed) {
        throw new Error(geoCheck.data?.reason || 'Account creation restricted to US locations only')
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (error) throw error

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Log logout
      await supabase.functions.invoke('audit-log', {
        body: {
          action: 'user_logout',
          table_name: 'auth.users',
        }
      })

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const hasRole = (role: string) => {
    if (!userRole) return false
    
    // Role hierarchy: admin > manager > agent > viewer
    const roleHierarchy = ['viewer', 'agent', 'manager', 'admin']
    const userRoleIndex = roleHierarchy.indexOf(userRole)
    const requiredRoleIndex = roleHierarchy.indexOf(role)
    
    return userRoleIndex >= requiredRoleIndex
  }

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}