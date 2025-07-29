import React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ReactNode, useState, useEffect } from "react"
import { Clock, ArrowLeft, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/NotificationBell"
import { GlobalSearch } from "@/components/GlobalSearch"


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
    }, 1000) // Update every second

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
          <header className="h-16 border-b bg-card shadow-soft flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoBack}
                className="text-foreground hover:bg-accent/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoForward}
                className="text-foreground hover:bg-accent/10"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground ml-2">Welcome back!</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block w-80">
                <GlobalSearch />
              </div>
              <NotificationBell />
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="w-4 h-4 text-foreground" />
                <span>{formatDateTime(currentDateTime)}</span>
              </div>
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