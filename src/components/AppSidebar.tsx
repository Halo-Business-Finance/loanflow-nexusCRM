import { BarChart3, Users, UserCheck, FileText, Settings, Home, Target, Calendar, Phone, Mail, Shield, LogOut, BookOpen, User, Lock, Building2, Zap } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RingCentralSetup } from "@/components/RingCentralSetup"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailSetup } from "@/components/EmailSetup"
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
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Leads", url: "/leads", icon: Target },
  { title: "Existing Clients", url: "/clients", icon: Users },
  { title: "Pipeline", url: "/pipeline", icon: BarChart3 },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Activities", url: "/activities", icon: Calendar },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Resources", url: "/resources", icon: BookOpen },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Users", url: "/users", icon: UserCheck },
  { title: "Users & Leads", url: "/users-leads", icon: Users },
  { title: "Enterprise", url: "/enterprise", icon: Building2 },
  { title: "Integrations", url: "/integrations", icon: Zap },
  { title: "AI Tools", url: "/ai-tools", icon: Target },
  { title: "Security", url: "/security", icon: Shield },
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
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">

        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground dark:text-white font-semibold">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink to={item.url} end className={getNavClass}>
                       <item.icon className="w-4 h-4 text-blue-500" />
                       {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground dark:text-white font-semibold">System Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                // Only show Security, Users, and Enterprise to admins and super_admins
                if ((item.title === "Security" || item.title === "Users" || item.title === "Enterprise") && !hasRole('admin') && !hasRole('super_admin')) {
                  return null;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink to={item.url} className={getNavClass}>
                         <item.icon className="w-4 h-4 text-blue-500" />
                         {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground dark:text-white font-semibold">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <PhoneDialer 
                trigger={
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Phone className="w-4 h-4" />
                    {state !== "collapsed" && <span>Make Call</span>}
                  </Button>
                }
              />
              <EmailComposer 
                trigger={
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Mail className="w-4 h-4" />
                    {state !== "collapsed" && <span>Send Email</span>}
                  </Button>
                }
              />
              <RingCentralSetup 
                trigger={
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Phone className="w-4 h-4" />
                    {state !== "collapsed" && <span>Phone Settings</span>}
                  </Button>
                }
              />
              <EmailSetup 
                trigger={
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Mail className="w-4 h-4" />
                    {state !== "collapsed" && <span>Email Settings</span>}
                  </Button>
                }
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* LoanFlow Branding and User Info */}
        <div className="mt-auto p-4 border-t space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 bg-gradient-primary rounded-lg hover:bg-gradient-primary/80"
              onClick={handleUserIconClick}
              title={user ? `Signed in as ${user.email}` : "Click to sign in"}
            >
              {user ? (
                <UserCheck className="w-4 h-4 text-sidebar-foreground" />
              ) : (
                <User className="w-4 h-4 text-sidebar-foreground" />
              )}
            </Button>
            {state !== "collapsed" && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground dark:text-white">LoanFlow</span>
                {user && (
                  <span className="text-xs text-muted-foreground dark:text-white truncate max-w-[140px]">
                    {userProfile?.first_name || user.user_metadata?.first_name || user.email}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            {state !== "collapsed" && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}