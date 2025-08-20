import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, Cloud, Building } from "lucide-react"
import { EmailSetup } from "@/components/EmailSetup"
import { RingCentralSetup } from "@/components/RingCentralSetup"

export function ConnectionHalo() {
  const [isOpen, setIsOpen] = useState(false)

  const HaloButton = () => (
    <button
      onClick={() => setIsOpen(true)}
      className="relative w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/30 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group"
      aria-label="Open connections"
    >
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 animate-pulse group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300" />
      
      {/* Inner halo ring */}
      <div className="absolute inset-1 rounded-full border border-primary/40 group-hover:border-primary/60 transition-all duration-300" />
      
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Cloud className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors" />
      </div>
      
      {/* Floating particles */}
      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary/60 animate-ping" />
      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-accent/60 animate-ping" style={{ animationDelay: '0.5s' }} />
    </button>
  )

  return (
    <>
      <HaloButton />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Cloud className="w-6 h-6 text-primary" />
              Connect Your Applications
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-sm text-muted-foreground">
              Connect your Microsoft 365 and RingCentral accounts to unlock powerful integrations and streamline your workflow.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Microsoft 365 Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Microsoft 365</CardTitle>
                      <CardDescription>Email, Calendar & Office Apps</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Connect your Microsoft 365 account to:
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Send emails directly from CRM
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Sync calendar events
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Access Office documents
                    </li>
                  </ul>
                  <EmailSetup 
                    trigger={
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Connect Microsoft 365
                      </Button>
                    }
                  />
                </CardContent>
              </Card>

              {/* RingCentral Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                      <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">RingCentral</CardTitle>
                      <CardDescription>Business Communications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Connect your RingCentral account to:
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      Make calls from CRM
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      Log call activities
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      Access call recordings
                    </li>
                  </ul>
                  <RingCentralSetup 
                    trigger={
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        Connect RingCentral
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">Security & Privacy</h4>
              <p className="text-xs text-muted-foreground">
                All connections use OAuth 2.0 secure authentication. We never store your passwords and only access the permissions you grant.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}