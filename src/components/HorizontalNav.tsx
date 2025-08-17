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
  Plus, 
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
  LogOut
} from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"

const navigationItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Leads", path: "/leads", icon: Users },
  { name: "Clients", path: "/clients", icon: Building2 },
  { name: "Pipeline", path: "/pipeline", icon: Target },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Documents", path: "/documents", icon: FileText },
  { name: "Activities", path: "/activities", icon: Activity },
]

const moreItems = [
  { name: "Settings", path: "/settings", icon: Settings },
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
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="px-6 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and App Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Sales</span>
            </div>
          </div>

          {/* Center - Global Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-md text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Side - Actions and Profile */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
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
                className={`relative flex items-center gap-2 px-3 py-4 text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
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
                className={`flex items-center gap-2 px-3 py-4 text-sm font-medium transition-colors hover:text-blue-600 ${
                  moreItems.some(item => isActivePath(item.path))
                    ? 'text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                More
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {moreItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.path} className="flex items-center gap-2">
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