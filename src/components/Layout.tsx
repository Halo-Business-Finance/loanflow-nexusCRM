import React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ReactNode, useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { NotificationBell } from "@/components/NotificationBell"
import { GlobalSearch } from "@/components/GlobalSearch"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ConnectionHalo } from "@/components/ConnectionHalo"


interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60000) // Update every minute instead of every second

    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }
    return date.toLocaleDateString('en-US', options)
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Responsive Header */}
          <header className="h-16 lg:h-20 bg-card shadow-soft">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
              {/* App Title - Responsive */}
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-primary dark:text-white no-underline truncate">
                  <span className="hidden sm:inline">Halo Business Finance</span>
                  <span className="sm:hidden">HBF</span>
                </h1>
              </div>
              
              {/* Right Side Actions - Responsive */}
              <div className="flex items-center gap-2 lg:gap-4">
                {/* Search - Hidden on small screens */}
                <div className="hidden lg:block w-60 xl:w-80">
                  <GlobalSearch />
                </div>
                
                {/* Theme Toggle - Hidden on mobile */}
                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>
                
                {/* Notification Bell */}
                <NotificationBell />
              </div>
            </div>
            
            {/* Menu Buttons on the Divider */}
            <div className="border-t bg-muted/20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="flex-shrink-0" />
                  
                  {/* Connection Halo Button */}
                  <div className="flex items-center gap-2 ml-2">
                    <ConnectionHalo />
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 bg-muted/30 overflow-x-hidden">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 ml-auto mr-auto pl-6 sm:pl-8 lg:pl-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}