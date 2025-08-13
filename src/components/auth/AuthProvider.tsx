import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { SecurityManager } from '@/lib/security'

interface AuthContextType {
  user: User | null
  session: Session | null
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
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    
    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          // Defer role fetching to avoid deadlock
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user.id)
            }
          }, 0)
        } else {
          setUserRole(null)
        }
        setLoading(false)
      }
    })

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted && !error) {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserRole(session.user.id)
          } else {
            setUserRole(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Session check failed:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])


  const fetchUserRole = async (userId: string) => {
    try {
      // Prefer secure RPC to avoid RLS issues on user_roles
      const { data, error } = await supabase.rpc('get_user_role', { p_user_id: userId })

      if (error) {
        console.error('get_user_role RPC error:', error)
        setUserRole('agent')
        return
      }

      // Fallback to agent if no active role found
      const role = (data as string | null) || 'agent'
      setUserRole(role)
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
      if (error) {
        // Check for common auth errors and provide better messages
        if (error.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password. If you just signed up, please check your email and confirm your account first.')
        }
        throw error
      }

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
      // Validate password strength first
      const passwordValidation = await SecurityManager.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(`Password does not meet security requirements: ${passwordValidation.errors.join(', ')}`);
      }

      // Get client information for security logging
      const deviceFingerprint = SecurityManager.generateDeviceFingerprint();
      const locationData = await SecurityManager.getLocationData();

      // Check rate limiting for signups
      const rateLimitResult = await SecurityManager.checkRateLimit(email, 'signup');
      if (!rateLimitResult.allowed) {
        throw new Error('You have reached the maximum of 5 sign-up attempts. Please try again later.');
      }

      // Check geo-restrictions
      console.log('Checking geo-restrictions for signup...')
      const geoCheck = await supabase.functions.invoke('geo-security')
      
      if (geoCheck.error || !geoCheck.data?.allowed) {
        // Log suspicious geo activity
        await SecurityManager.logSecurityEvent({
          event_type: 'geo_restriction_violation',
          severity: 'high',
          details: {
            email,
            attempted_location: geoCheck.data?.country_code || 'unknown',
            reason: geoCheck.data?.reason || 'Geographic restriction',
            action: 'signup'
          },
          device_fingerprint: deviceFingerprint,
          location: locationData
        });
        
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

      if (error) {
        // Log failed signup
        await SecurityManager.logSecurityEvent({
          event_type: 'signup_failed',
          severity: 'medium',
          details: {
            email,
            error: error.message
          },
          device_fingerprint: deviceFingerprint,
          location: locationData
        });
        
        throw error;
      }

      // Log successful signup
      await SecurityManager.logSecurityEvent({
        event_type: 'signup_success',
        severity: 'low',
        details: {
          email,
          first_name: firstName,
          last_name: lastName
        },
        device_fingerprint: deviceFingerprint,
        location: locationData
      });

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
    console.log('signOut function called')
    try {
      console.log('Attempting to log logout...')
      // Log logout
      await supabase.functions.invoke('audit-log', {
        body: {
          action: 'user_logout',
          table_name: 'auth.users',
        }
      })

      console.log('Attempting Supabase signOut...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signOut error:', error)
        throw error
      }

      console.log('SignOut successful, showing toast...')
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error: any) {
      console.error('SignOut catch block error:', error)
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const hasRole = (role: string) => {
    if (!userRole) return false
    
    // Super admin has access to everything
    if (userRole === 'super_admin') return true
    
    // If checking for super_admin specifically, only super_admin can have it
    if (role === 'super_admin') return userRole === 'super_admin'
    
    // Role hierarchy: super_admin > admin > manager > agent/loan_originator/loan_processor/funder/underwriter/closer > tech
    const roleHierarchy = ['tech', 'closer', 'underwriter', 'funder', 'loan_processor', 'loan_originator', 'agent', 'manager', 'admin']
    const userRoleIndex = roleHierarchy.indexOf(userRole)
    const requiredRoleIndex = roleHierarchy.indexOf(role)
    
    // If role not found in hierarchy, deny access (except for super_admin handled above)
    if (requiredRoleIndex === -1) return false
    
    return userRoleIndex >= requiredRoleIndex
  }

  const value = {
    user,
    session,
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