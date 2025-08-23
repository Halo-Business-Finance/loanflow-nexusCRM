import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { X, Home, Users, Target, BarChart3, FileText, Activity, Building2, User, Shield, Settings, Calendar, Download, RefreshCw, Camera, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FolderSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeFolder: string | null
}

const folderMenuItems = {
  home: [
    { name: "Dashboard", path: "/", icon: Home },
  ],
  leads: [
    { name: "All Leads", path: "/leads", icon: Users },
    { name: "New Lead", path: "/leads/new", icon: User },
    { name: "Lead Stats", path: "/leads/stats", icon: BarChart3 },
    { name: "Lead Assignment", path: "/leads/assignment", icon: Target },
  ],
  borrowers: [
    { name: "All Borrowers", path: "/existing-borrowers", icon: Building2 },
    { name: "Borrower Details", path: "/existing-borrowers/details", icon: User },
    { name: "Loan History", path: "/existing-borrowers/history", icon: FileText },
  ],
  pipeline: [
    { name: "Pipeline View", path: "/pipeline", icon: Target },
    { name: "Pipeline Analytics", path: "/pipeline/analytics", icon: BarChart3 },
    { name: "Stage Management", path: "/pipeline/stages", icon: Settings },
  ],
  underwriter: [
    { name: "Underwriter Dashboard", path: "/underwriter", icon: Shield },
    { name: "Documents", path: "/documents", icon: FileText },
    { name: "Document Review", path: "/underwriter/documents", icon: FileText },
    { name: "Risk Assessment", path: "/underwriter/risk", icon: Activity },
  ],
  activities: [
    { name: "All Activities", path: "/activities", icon: Activity },
    { name: "Calendar", path: "/activities/calendar", icon: Calendar },
    { name: "Tasks", path: "/activities/tasks", icon: FileText },
  ],
  security: [
    { name: "Security Dashboard", path: "/security", icon: Shield },
    { name: "Access Management", path: "/security/access", icon: User },
    { name: "Audit Logs", path: "/security/audit", icon: FileText },
    { name: "Threat Detection", path: "/security/threats", icon: Activity },
    { name: "Compliance", path: "/security/compliance", icon: Settings },
    { name: "System Config", path: "/settings/system", icon: Settings },
  ],
  enterprise: [
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
}

export function FolderSidebar({ isOpen, onClose, activeFolder }: FolderSidebarProps) {
  const location = useLocation()

  const menuItems = activeFolder ? folderMenuItems[activeFolder as keyof typeof folderMenuItems] || [] : []

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/"
    return location.pathname.startsWith(path)
  }

  const handleItemClick = () => {
    onClose()
  }

  if (!isOpen || !activeFolder) return null

  return (
    <div 
      className={cn(
        "w-80 bg-background border-r border-border shadow-lg transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-lg font-semibold text-white capitalize">
          {activeFolder} Menu
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={handleItemClick}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
              isActivePath(item.path)
                ? "bg-blue-600 text-white shadow-lg"
                : "text-foreground hover:bg-muted hover:text-blue-600"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}