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
  LayoutDashboard
} from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ConnectionHalo } from "@/components/ConnectionHalo"


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
]

const securityItems = [
  { name: "Security Dashboard", path: "/security", icon: Shield },
  { name: "Access Management", path: "/security/access", icon: User },
  { name: "Audit Logs", path: "/security/audit", icon: FileText },
  { name: "Threat Detection", path: "/security/threats", icon: Activity },
  { name: "Compliance", path: "/security/compliance", icon: Settings },
  { name: "System Config", path: "/settings/system", icon: Settings },
]

const enterpriseItems = [
  { name: "Overview", path: "/enterprise", icon: Building2 },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  
  { name: "User Management", path: "/settings/users", icon: User },
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

interface HorizontalNavProps {
  onFolderClick?: (folderName: string) => void
  sidebarOpen?: boolean
  activeFolder?: string | null
}

export function HorizontalNav({ onFolderClick, sidebarOpen = false, activeFolder = null }: HorizontalNavProps = {}) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false)
  const [localActiveFolder, setLocalActiveFolder] = useState<string | null>(null)

  // Use local state if no props are provided (backward compatibility)
  const isControlled = onFolderClick !== undefined
  const currentSidebarOpen = isControlled ? sidebarOpen : localSidebarOpen
  const currentActiveFolder = isControlled ? activeFolder : localActiveFolder

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

  const handleFolderClick = (folderName: string) => {
    if (isControlled && onFolderClick) {
      onFolderClick(folderName)
    } else {
      setLocalActiveFolder(folderName)
      setLocalSidebarOpen(true)
    }
  }

  const handleCloseSidebar = () => {
    if (!isControlled) {
      setLocalSidebarOpen(false)
      setTimeout(() => setLocalActiveFolder(null), 300)
    }
  }

  return (
    <div className="bg-background border-b border-border sticky top-0 z-50">
      {/* Top Bar */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <img src="/lovable-uploads/e43cc6c0-ece4-497a-a3c6-e2e46d114c45.png" alt="Logo" className="h-60 w-auto" />
          </div>

          {/* Center - Connection Status */}
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <ConnectionHalo />
            </div>
          </div>

          {/* Right Side - Date/Time, Search, Actions and Profile */}
          <div className="flex flex-col items-end gap-2">
            {/* Date and Time */}
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            {/* Actions Row */}
            <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="w-64">
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
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
            
            {/* Theme & Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg z-50">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-navy/10 hover:text-navy rounded-sm">
                    <Settings className="h-4 w-4" />
                    General Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="flex items-center justify-between w-full px-2 py-2">
                    <span className="text-sm">Theme</span>
                    <ThemeToggle />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="px-6 pb-0 relative">
        {/* Enhanced base line with gradient */}
        <div className="absolute bottom-0 left-0 right-0 z-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        <nav className="flex items-center justify-center relative z-10">
          <div className="flex items-center space-x-1">
          {/* Dashboard Button - Simple Navigation */}
          <Button 
            asChild
            variant="ghost" 
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              isActivePath("/")
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Link to="/" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="relative">
                Dashboard
                {isActivePath("/") && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
                )}
              </span>
            </Link>
          </Button>

          {/* Leads Button */}
          <Button 
            variant="ghost" 
            onClick={() => handleFolderClick('leads')}
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              leadsItems.some(item => isActivePath(item.path))
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Users className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="relative">
              Leads
              {leadsItems.some(item => isActivePath(item.path)) && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
              )}
            </span>
          </Button>

          {/* Existing Borrowers Button */}
          <Button 
            variant="ghost" 
            onClick={() => handleFolderClick('borrowers')}
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              borrowersItems.some(item => isActivePath(item.path))
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Building2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="relative">
              Existing Borrowers
              {borrowersItems.some(item => isActivePath(item.path)) && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
              )}
            </span>
          </Button>

          {/* Pipeline Button */}
          <Button 
            variant="ghost" 
            onClick={() => handleFolderClick('pipeline')}
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              pipelineItems.some(item => isActivePath(item.path))
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Target className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="relative">
              Pipeline
              {pipelineItems.some(item => isActivePath(item.path)) && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
              )}
            </span>
          </Button>

          {/* Underwriter Button */}
          <Button 
            variant="ghost" 
            onClick={() => handleFolderClick('underwriter')}
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              underwriterItems.some(item => isActivePath(item.path))
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Shield className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="relative">
              Underwriter
              {underwriterItems.some(item => isActivePath(item.path)) && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
              )}
            </span>
          </Button>

          {/* Activities Button */}
          <Button 
            variant="ghost" 
            onClick={() => handleFolderClick('activities')}
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              activitiesItems.some(item => isActivePath(item.path))
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Activity className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="relative">
              Activities
              {activitiesItems.some(item => isActivePath(item.path)) && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
              )}
            </span>
          </Button>
          
          {/* Security Button */}
          <Button 
            variant="ghost" 
            onClick={() => handleFolderClick('security')}
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              securityItems.some(item => isActivePath(item.path))
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Shield className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="relative">
              Security
              {securityItems.some(item => isActivePath(item.path)) && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
              )}
            </span>
          </Button>

          {/* Enterprise Button */}
          <Button 
            variant="ghost" 
            onClick={() => handleFolderClick('enterprise')}
            className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 text-white bg-gradient-to-b from-blue-600 to-blue-700 border-x border-t border-blue-500 rounded-t-xl border-b-transparent shadow-lg ${
              enterpriseItems.some(item => isActivePath(item.path.split('#')[0]))
                ? 'shadow-blue-500/30 -mb-px z-20 before:absolute before:inset-x-0 before:-bottom-px before:h-px before:bg-gradient-to-r before:from-blue-300/0 before:via-blue-200 before:to-blue-300/0'
                : 'shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            <Building2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="relative">
              Enterprise
              {enterpriseItems.some(item => isActivePath(item.path.split('#')[0])) && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300/0 via-blue-200 to-blue-300/0 rounded-full"></div>
              )}
            </span>
          </Button>
          </div>
        </nav>
      </div>
    </div>
  )
}