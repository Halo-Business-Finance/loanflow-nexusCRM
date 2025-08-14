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
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <strong>Document Security Enhanced:</strong> Lead documents are now fully protected with ownership-based access controls.
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Security Improvements:
            </h4>
            <ul className="text-sm space-y-1 ml-6">
              <li>• <strong>Ownership Controls:</strong> Users can only access documents for leads they own</li>
              <li>• <strong>Secure Upload Validation:</strong> Pre-upload authorization checks prevent unauthorized uploads</li>
              <li>• <strong>Storage Security:</strong> Files organized in user-specific folders with access controls</li>
              <li>• <strong>Audit Logging:</strong> All document operations (upload, view, delete) are monitored</li>
              <li>• <strong>Admin Oversight:</strong> Administrators have controlled access for compliance needs</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              <Lock className="h-3 w-3 mr-1" />
              Secure Access
            </Badge>
            <Badge variant="outline" className="text-green-700 border-green-300">
              <Shield className="h-3 w-3 mr-1" />
              Ownership Verified
            </Badge>
            <Badge variant="outline" className="text-green-700 border-green-300">
              <FileText className="h-3 w-3 mr-1" />
              Audit Compliant
            </Badge>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};