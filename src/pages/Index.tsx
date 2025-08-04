import Layout from "@/components/Layout"
import Dashboard from "@/components/Dashboard"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Index = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  
  // Debug current auth state
  console.log('Index page - Auth state:', { 
    isLoggedIn: !!user, 
    userId: user?.id,
    email: user?.email,
    loading 
  })

  // Show loading state while checking auth
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // If not logged in, show login prompt
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome to LoanFlow</h1>
            <p className="text-muted-foreground">Please sign in to access your documents and dashboard</p>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            className="gap-2"
            size="lg"
          >
            <LogIn className="h-4 w-4" />
            Sign In / Sign Up
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

export default Index