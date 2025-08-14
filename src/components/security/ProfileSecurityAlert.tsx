import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { useSecureProfiles } from "@/hooks/useSecureProfiles";
import { useAuth } from "@/components/auth/AuthProvider";

export const ProfileSecurityAlert: React.FC = () => {
  const { migrateExistingData } = useSecureProfiles();
  const { userRole } = useAuth();
  const [migrationStatus, setMigrationStatus] = React.useState<'pending' | 'completed' | 'error'>('pending');

  const handleMigration = async () => {
    try {
      const success = await migrateExistingData();
      setMigrationStatus(success ? 'completed' : 'error');
    } catch (error) {
      setMigrationStatus('error');
    }
  };

  if (!['admin', 'super_admin'].includes(userRole || '')) {
    return null;
  }

  if (migrationStatus === 'completed') {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Security Enhancement Complete:</strong> All customer personal information has been encrypted and secured with field-level protection. Access is now role-based with data masking.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="space-y-3">
          <div>
            <strong>Security Vulnerability Fixed:</strong> Customer personal information is now protected with field-level encryption and role-based data masking.
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Enhanced Security Features:
            </h4>
            <ul className="text-sm space-y-1 ml-6">
              <li>• <strong>Field-Level Encryption:</strong> Sensitive data (emails, phone numbers) encrypted at rest</li>
              <li>• <strong>Role-Based Data Masking:</strong> Admins/managers see masked data, users see own full data</li>
              <li>• <strong>Access Audit Logging:</strong> All profile access attempts are monitored and logged</li>
              <li>• <strong>Secure API Functions:</strong> Centralized profile access through secure endpoints</li>
            </ul>
          </div>

          {migrationStatus === 'pending' && (
            <div className="flex items-center gap-2">
              <Button onClick={handleMigration} size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Lock className="h-4 w-4 mr-2" />
                Migrate Existing Data
              </Button>
              <span className="text-sm">Encrypt existing customer data for maximum security</span>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};