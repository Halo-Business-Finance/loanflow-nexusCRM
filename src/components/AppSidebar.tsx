import { BarChart3, Users, UserCheck, FileText, Settings, Home, Target, Calendar, Phone, Mail, Shield, LogOut } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { RingCentralSetup } from "@/components/RingCentralSetup"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailSetup } from "@/components/EmailSetup"
import { EmailComposer } from "@/components/EmailComposer"
import { useAuth } from "@/components/auth/AuthProvider"

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
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Pipeline", url: "/pipeline", icon: BarChart3 },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Activities", url: "/activities", icon: Calendar },
  { title: "Reports", url: "/reports", icon: BarChart3 },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Security", url: "/security", icon: Shield },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const { signOut, user, userRole, hasRole } = useAuth()

  const isActive = (path: string) => currentPath === path
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            {state !== "collapsed" && (
              <span className="font-bold text-lg text-foreground">LoanFlow</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="w-4 h-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                // Only show Security to admins
                if (item.title === "Security" && !hasRole('admin')) {
                  return null;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className="w-4 h-4" />
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
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
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

        {/* User Info and Logout */}
        <div className="mt-auto p-4 border-t">
          {state !== "collapsed" && (
            <div className="mb-3">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole} User</p>
            </div>
          )}
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