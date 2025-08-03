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
      hour: '2-digit',
      minute: '2-digit'
    }
    return date.toLocaleDateString('en-US', options)
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-20 border-b bg-card shadow-soft flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
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
              <div className="flex items-center gap-2 ml-2">
                <h1 className="text-xl font-semibold text-primary dark:text-white no-underline">Halo Business Finance</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block w-80">
                <GlobalSearch />
              </div>
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}