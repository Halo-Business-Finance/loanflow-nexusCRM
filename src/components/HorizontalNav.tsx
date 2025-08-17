import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Settings,
  ChevronDown,
  Home,
  Users,
  Target,
  BarChart3,
  FileText,
  Activity,
  Building2,
  User,
  LogOut,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { ThemeToggle } from "@/components/ThemeToggle"

const navigationItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Leads", path: "/leads", icon: Users },
  { name: "Existing Borrowers", path: "/existing-borrowers", icon: Building2 },
  { name: "Pipeline", path: "/pipeline", icon: Target },
  { name: "Documents", path: "/documents", icon: FileText },
  { name: "Activities", path: "/activities", icon: Activity },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
]

const moreItems = [
  { name: "Users", path: "/users", icon: User },
  { name: "Security", path: "/security", icon: Settings },
  { name: "Enterprise", path: "/enterprise", icon: Building2 },
]

export function HorizontalNav() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/"
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="bg-background border-b border-border sticky top-0 z-50">
      {/* Top Bar */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and App Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Sales</span>
            </div>
          </div>

          {/* Center - Analytics Dashboard Section */}
          <div className="flex-1 flex items-center justify-between max-w-4xl mx-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor your business performance and key metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Last 30 days
              </Button>
              <Button variant="outline" size="sm" className="text-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="text-sm bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Right Side - Actions and Profile */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="font-medium">{user?.email}</div>
                  <div className="text-xs text-muted-foreground">User Account</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="px-6">
        <nav className="flex items-center space-x-8">
          {navigationItems.map((item) => {
            const isActive = isActivePath(item.path)
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center gap-2 px-3 py-1 text-sm font-medium transition-colors hover:text-primary ${
                  isActive 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-foreground/70 hover:text-primary'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
          
          {/* More Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 px-3 py-1 text-sm font-medium transition-colors hover:text-primary ${
                  moreItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-primary'
                }`}
              >
                More
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg">
              {moreItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-muted rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </div>
  )
}