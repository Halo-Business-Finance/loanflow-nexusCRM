import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";

export const DocumentSecurityAlert: React.FC = () => {
  const { userRole } = useAuth();

  if (!['admin', 'super_admin', 'manager'].includes(userRole || '')) {
    return null;
  }

  return (
    <Alert className="border-green-200 bg-green-50 mb-4">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span><strong>Document Security:</strong> Enhanced protection with ownership-based access controls active.</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Secure
            </Badge>
            <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Compliant
            </Badge>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};