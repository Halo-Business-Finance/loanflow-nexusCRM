import React, { useState } from 'react'
import { Plus, AlertTriangle, User, Users, Calendar, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function SimpleQuickActions() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleEmergencyLockdown = async () => {
    console.log('Emergency lockdown clicked!')
    
    try {
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out
      await supabase.auth.signOut({ scope: 'global' })
      
      // Show notification
      toast({
        title: "🚨 EMERGENCY LOCKDOWN",
        description: "Session terminated successfully",
        variant: "destructive",
      })
      
      // Redirect
      window.location.href = '/'
      
    } catch (error) {
      console.error('Lockdown error:', error)
      window.location.href = '/'
    }
  }

  const handleNavigation = (route: string) => {
    console.log('Navigating to:', route)
    navigate(route)
    setIsOpen(false)
  }

  return (
    <>
      {/* Desktop Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 hidden md:block">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg" 
              className="h-16 w-16 rounded-full shadow-xl bg-primary hover:bg-primary/90"
              onClick={() => {
                console.log('FAB clicked')
                setIsOpen(true)
              }}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-background border shadow-lg">
            <DialogHeader>
              <DialogTitle>Quick Actions</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 p-4">
              {/* New Lead */}
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleNavigation('/leads')}
              >
                <CardContent className="p-4 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-medium">New Lead</div>
                  <div className="text-xs text-muted-foreground">Add new lead</div>
                </CardContent>
              </Card>

              {/* New Client */}
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleNavigation('/clients')}
              >
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="font-medium">New Client</div>
                  <div className="text-xs text-muted-foreground">Add client</div>
                </CardContent>
              </Card>

              {/* Pipeline */}
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleNavigation('/pipeline')}
              >
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="font-medium">Pipeline</div>
                  <div className="text-xs text-muted-foreground">View pipeline</div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleNavigation('/settings')}
              >
                <CardContent className="p-4 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                  <div className="font-medium">Settings</div>
                  <div className="text-xs text-muted-foreground">Configure app</div>
                </CardContent>
              </Card>

              {/* Emergency Lockdown - Full Width */}
              <Card 
                className="col-span-2 cursor-pointer hover:bg-red-50 transition-colors border-red-200"
                onClick={handleEmergencyLockdown}
              >
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <div className="font-medium text-red-600">Emergency Lockdown</div>
                  <div className="text-xs text-red-500">Immediate security lockdown</div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Button */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 md:hidden z-50">
        <Button 
          onClick={() => {
            console.log('Mobile button clicked')
            setIsOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Quick Actions
        </Button>
      </div>
    </>
  )
}