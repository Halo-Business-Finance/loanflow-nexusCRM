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
  RefreshCw,
  Camera,
  Shield,
  LayoutDashboard,
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { ThemeToggle } from "@/components/ThemeToggle"

const homeItems = [
  { name: "Dashboard", path: "/", icon: Home },
]

const leadsItems = [
  { name: "All Leads", path: "/leads", icon: Users },
  { name: "New Lead", path: "/leads/new", icon: User },
  { name: "Lead Stats", path: "/leads/stats", icon: BarChart3 },
  { name: "Lead Assignment", path: "/leads/assignment", icon: Target },
]

const borrowersItems = [
  { name: "All Borrowers", path: "/existing-borrowers", icon: Building2 },
  { name: "Borrower Details", path: "/existing-borrowers/details", icon: User },
  { name: "Loan History", path: "/existing-borrowers/history", icon: FileText },
]

const pipelineItems = [
  { name: "Pipeline View", path: "/pipeline", icon: Target },
  { name: "Pipeline Analytics", path: "/pipeline/analytics", icon: BarChart3 },
  { name: "Stage Management", path: "/pipeline/stages", icon: Settings },
]

const underwriterItems = [
  { name: "Underwriter Dashboard", path: "/underwriter", icon: Shield },
  { name: "Documents", path: "/documents", icon: FileText },
  { name: "Document Review", path: "/underwriter/documents", icon: FileText },
  { name: "Risk Assessment", path: "/underwriter/risk", icon: Activity },
]


const activitiesItems = [
  { name: "All Activities", path: "/activities", icon: Activity },
  { name: "Calendar", path: "/activities/calendar", icon: Calendar },
  { name: "Tasks", path: "/activities/tasks", icon: FileText },
]

const settingsItems = [
  { name: "General Settings", path: "/settings", icon: Settings },
  { name: "User Management", path: "/settings/users", icon: User },
  { name: "System Config", path: "/settings/system", icon: Settings },
]

const securityItems = [
  { name: "Security Dashboard", path: "/security", icon: Shield },
  { name: "Access Management", path: "/security/access", icon: User },
  { name: "Audit Logs", path: "/security/audit", icon: FileText },
  { name: "Threat Detection", path: "/security/threats", icon: Activity },
  { name: "Compliance", path: "/security/compliance", icon: Settings },
]

const enterpriseItems = [
  { name: "Overview", path: "/enterprise", icon: Building2 },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Users", path: "/users", icon: User },
  { name: "Integrations", path: "/integrations", icon: RefreshCw },
  { name: "AI Tools", path: "/ai-tools", icon: Settings },
  { name: "API Docs", path: "/api-docs", icon: FileText },
  { name: "Screenshots", path: "/screenshots", icon: Camera },
  { name: "Resources", path: "/resources", icon: FileText },
  { name: "Custom Objects", path: "/enterprise#custom-objects", icon: Home },
  { name: "Workflow Builder", path: "/enterprise#workflows", icon: RefreshCw },
  { name: "Approval Processes", path: "/enterprise#approvals", icon: Calendar },
  { name: "Territory Management", path: "/enterprise#territories", icon: Target },
  { name: "Sales Forecasting", path: "/enterprise#forecasting", icon: BarChart3 },
  { name: "Opportunity Splits", path: "/enterprise#opportunities", icon: Download },
]

const moreItems = [
]

export function HorizontalNav() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  const getUserDisplayName = () => {
    const firstName = user?.user_metadata?.first_name
    const emailName = user?.email?.split('@')[0]
    const name = firstName || emailName || 'User'
    return capitalizeFirstLetter(name)
  }

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
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and App Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary rounded flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">LoanFlow CRM</span>
            </div>
          </div>

          {/* Right Side - Actions and Profile */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0">
                  <Avatar className="h-8 w-8">
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
      
      {/* Welcome Message */}
      <div className="px-6 py-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">
              Welcome back, {getUserDisplayName()}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 mr-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.forward()}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-border rounded-md text-sm focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="px-6">
        <nav className="flex items-center justify-center space-x-6">
          {/* Dashboard Button */}
          <Button 
            asChild
            variant="ghost" 
            className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
              isActivePath("/")
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground/70 hover:text-blue-600'
            }`}
          >
            <Link to="/" className="flex items-center gap-1">
              <LayoutDashboard className="h-3 w-3" />
              Dashboard
            </Link>
          </Button>

          {/* Leads Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  leadsItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Users className="h-3 w-3" />
                Leads
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {leadsItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Existing Borrowers Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  borrowersItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Building2 className="h-3 w-3" />
                Existing Borrowers
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {borrowersItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Pipeline Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  pipelineItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Target className="h-3 w-3" />
                Pipeline
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {pipelineItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Underwriter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  underwriterItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Shield className="h-3 w-3" />
                Underwriter
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {underwriterItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Activities Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  activitiesItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Activity className="h-3 w-3" />
                Activities
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {activitiesItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  settingsItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Settings className="h-3 w-3" />
                Settings
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {settingsItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Security Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  securityItems.some(item => isActivePath(item.path))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Shield className="h-3 w-3" />
                Security
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {securityItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Enterprise Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50 rounded-md ${
                  enterpriseItems.some(item => isActivePath(item.path.split('#')[0]))
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/70 hover:text-blue-600'
                }`}
              >
                <Building2 className="h-3 w-3" />
                Enterprise
                <ChevronDown className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background border border-border shadow-lg z-50">
              {enterpriseItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-sm">
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