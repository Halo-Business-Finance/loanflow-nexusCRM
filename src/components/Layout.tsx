import React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ReactNode, useState, useEffect } from "react"
import { Clock, ArrowLeft, ArrowRight } from "lucide-react"
// Using the uploaded LoanFlow CRM logo
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/NotificationBell"
import { GlobalSearch } from "@/components/GlobalSearch"
import { ThemeToggle } from "@/components/ThemeToggle"


interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoForward = () => {
    navigate(1)
  }

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
          <header className="h-16 lg:h-20 border-b bg-card shadow-soft">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="flex-shrink-0" />
                
                {/* Navigation Buttons - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleGoBack}
                    className="text-primary-foreground hover:bg-primary/90"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleGoForward}
                    className="text-primary-foreground hover:bg-primary/90"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* App Title - Responsive */}
                <div className="flex items-center gap-2 ml-2 min-w-0">
                  <h1 className="text-lg lg:text-xl font-semibold text-primary dark:text-white no-underline truncate">
                    <span className="hidden sm:inline">Halo Business Finance</span>
                    <span className="sm:hidden">HBF</span>
                  </h1>
                </div>
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
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 bg-muted/30 overflow-x-hidden">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}