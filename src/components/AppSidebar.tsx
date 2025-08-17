import { BarChart3, Users, UserCheck, FileText, Settings, Home, Target, Calendar, Phone, Mail, Shield, LogOut, BookOpen, User, Lock, Building2, Zap, ChevronDown } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { useAuth } from "@/components/auth/AuthProvider"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home, description: "View overview of leads, pipeline, and key metrics" },
  { title: "Leads", url: "/leads", icon: Target, description: "Manage potential customers and track lead progress" },
  { title: "Existing Borrowers", url: "/existing-borrowers", icon: Users, description: "View and manage your current borrower base" },
  { title: "Pipeline", url: "/pipeline", icon: BarChart3, description: "Track deals through your sales pipeline" },
  { title: "Activities", url: "/activities", icon: Calendar, description: "Schedule and track meetings, calls, and tasks" },
  { title: "Resources", url: "/resources", icon: BookOpen, description: "Access training materials and documentation" },
]

const underwriterItems = [
  { title: "Underwriter Dashboard", url: "/underwriter", icon: UserCheck, description: "Main underwriting dashboard and workflows" },
  { title: "Documents", url: "/documents", icon: FileText, description: "Manage loan documents and borrower files" },
  { title: "Risk Assessment", url: "/underwriter/risk", icon: Shield, description: "Risk analysis and assessment tools" },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings, description: "Configure application preferences and account settings" },
  { title: "Users", url: "/users", icon: UserCheck, description: "Manage team members and user permissions (Admin only)" },
  { title: "Enterprise", url: "/enterprise", icon: Building2, description: "Advanced business features and workflow management (Admin only)" },
  { title: "Integrations", url: "/integrations", icon: Zap, description: "Connect external tools and services" },
  { title: "AI Tools", url: "/ai-tools", icon: Target, description: "Access AI-powered features and automation" },
  { title: "Screenshots", url: "/screenshots", icon: FileText, description: "View CRM system screenshots for presentations" },
  { title: "API Docs", url: "/api-docs", icon: FileText, description: "View API documentation and examples" },
  { title: "Security", url: "/security", icon: Shield, description: "Monitor security events and manage access controls (Admin only)" },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname
  const { signOut, user, userRole, hasRole } = useAuth()
  const [userProfile, setUserProfile] = useState<{ first_name?: string } | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setUserProfile(data)
        }
      }
    }

    fetchUserProfile()
  }, [user?.id])

  const isActive = (path: string) => currentPath === path
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"

  const handleUserIconClick = () => {
    if (user) {
      // If logged in, show user menu or go to profile
      // For now, we'll navigate to settings
      navigate('/settings')
    } else {
      // If not logged in, go to auth page
      navigate('/auth')
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
        <SidebarContent className="bg-card border-r">
          {/* LoanFlow Branding and User Info */}
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0 bg-gradient-primary rounded-lg hover:bg-gradient-primary/80"
                    onClick={handleUserIconClick}
                  >
                    {user ? (
                      <UserCheck className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{user ? `Signed in as ${user.email}. Click to view settings.` : "Click to sign in"}</p>
                </TooltipContent>
              </Tooltip>
              {state !== "collapsed" && (
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-sidebar-foreground">LoanFlow CRM</span>
                  {user && (
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {userProfile?.first_name || user.user_metadata?.first_name || user.email}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground font-semibold underline">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {state === "collapsed" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} end className={getNavClass}>
                              <item.icon className="w-5 h-5 text-sidebar-primary" />
                              <span className="sr-only">{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavClass} title={item.description}>
                          <item.icon className="w-5 h-5 text-sidebar-primary" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
                
                {/* Underwriter Dropdown */}
                <SidebarMenuItem>
                  {state === "collapsed" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink to="/underwriter" className={getNavClass}>
                            <UserCheck className="w-5 h-5 text-sidebar-primary" />
                            <span className="sr-only">Underwriter</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-xs">
                          <p className="font-semibold">Underwriter</p>
                          <p className="text-sm text-muted-foreground">Underwriting workflows and document management</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between hover:bg-accent hover:text-accent-foreground">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-sidebar-primary" />
                            <span>Underwriter</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" className="w-56 bg-white dark:bg-gray-800 border border-border shadow-lg z-50 rounded-lg">
                        {underwriterItems.map((item) => (
                          <DropdownMenuItem key={item.title} asChild>
                            <NavLink to={item.url} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">
                              <item.icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-semibold underline">System Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                // Only show Security, Users, and Enterprise to admins and super_admins
                if ((item.title === "Security" || item.title === "Users" || item.title === "Enterprise")) {
                  console.log(`Checking access for ${item.title}: hasRole('admin')=${hasRole('admin')}, hasRole('super_admin')=${hasRole('super_admin')}`)
                  if (!hasRole('admin') && !hasRole('super_admin')) {
                    console.log(`Hiding ${item.title} - no admin access`)
                    return null;
                  }
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    {state === "collapsed" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} className={getNavClass}>
                              <item.icon className="w-5 h-5 text-sidebar-primary" />
                              <span className="sr-only">{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavClass} title={item.description}>
                          <item.icon className="w-5 h-5 text-sidebar-primary" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-semibold underline">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <PhoneDialer 
                      trigger={
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                          <Phone className="w-4 h-4" />
                          {state !== "collapsed" && <span>Make Call</span>}
                        </Button>
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Open phone dialer to make calls to leads and borrowers</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <EmailComposer 
                      trigger={
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                          <Mail className="w-4 h-4" />
                          {state !== "collapsed" && <span>Send Email</span>}
                        </Button>
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Compose and send emails to leads and borrowers</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out Button at Bottom */}
        {user && (
          <div className="mt-auto p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    console.log('Sign Out button clicked!')
                    signOut()
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  {state !== "collapsed" && <span>Sign Out</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sign out of your account and return to login page</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

      </SidebarContent>
    </Sidebar>
  </TooltipProvider>
  )
}