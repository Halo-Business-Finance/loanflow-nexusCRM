import React from 'react';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmergencyMaintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-16 w-16 text-destructive" />
              <AlertTriangle className="h-8 w-8 text-destructive absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl text-destructive">Emergency Maintenance</CardTitle>
          <CardDescription className="text-lg">
            System is temporarily unavailable due to security measures
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Emergency shutdown activated</span>
          </div>
          
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">What happened?</p>
            <p className="text-muted-foreground">
              Our security systems detected a potential threat and automatically shut down 
              the application to protect your data.
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">When will it be back?</p>
            <p className="text-muted-foreground">
              Our security team is investigating. The system will automatically restore 
              once the threat is resolved, typically within 15-30 minutes.
            </p>
          </div>
          
          <div className="pt-4 text-xs text-muted-foreground">
            <p>If you have urgent matters, please contact support directly.</p>
            <p className="mt-1">Incident ID: {Date.now()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}