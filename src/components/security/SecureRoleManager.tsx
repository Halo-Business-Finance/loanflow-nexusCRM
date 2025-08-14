import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Key, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecureRoleManagement } from '@/hooks/useSecureRoleManagement';
import { UserRole } from '@/hooks/useRoleBasedAccess';

interface SecureRoleManagerProps {
  targetUserId: string;
  targetUserName: string;
  currentRole?: UserRole;
  onRoleChanged?: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; level: number }[] = [
  { value: 'super_admin', label: 'Super Admin', level: 4 },
  { value: 'admin', label: 'Admin', level: 3 },
  { value: 'manager', label: 'Manager', level: 2 },
  { value: 'loan_originator', label: 'Loan Originator', level: 1 },
  { value: 'loan_processor', label: 'Loan Processor', level: 1 },
  { value: 'funder', label: 'Funder', level: 1 },
  { value: 'underwriter', label: 'Underwriter', level: 1 },
  { value: 'closer', label: 'Closer', level: 1 },
  { value: 'agent', label: 'Agent', level: 1 },
  { value: 'tech', label: 'Tech', level: 0 },
];

export const SecureRoleManager: React.FC<SecureRoleManagerProps> = ({
  targetUserId,
  targetUserName,
  currentRole,
  onRoleChanged
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [reason, setReason] = useState('');
  const [mfaInput, setMfaInput] = useState('');
  const [showMfaForm, setShowMfaForm] = useState(false);
  
  const {
    isLoading,
    mfaToken,
    hasMfaVerification,
    generateMfaVerification,
    verifyMfaToken,
    assignUserRole,
    revokeUserRole,
    resetMfaState
  } = useSecureRoleManagement();

  const requiresMfa = (role?: UserRole | '') => {
    return role === 'super_admin' || role === 'admin' || currentRole === 'super_admin' || currentRole === 'admin';
  };

  const handleGenerateMfa = async () => {
    const result = await generateMfaVerification();
    if (result.success) {
      setShowMfaForm(true);
    }
  };

  const handleVerifyMfa = async () => {
    const verified = await verifyMfaToken(mfaInput);
    if (verified) {
      setShowMfaForm(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole || !reason.trim()) {
      return;
    }

    const needsMfa = requiresMfa(selectedRole);
    
    if (needsMfa && !hasMfaVerification) {
      await handleGenerateMfa();
      return;
    }

    const result = await assignUserRole(targetUserId, selectedRole, reason, hasMfaVerification);
    
    if (result.success) {
      setSelectedRole('');
      setReason('');
      setMfaInput('');
      onRoleChanged?.();
    }
  };

  const handleRevokeRole = async () => {
    if (!reason.trim()) {
      return;
    }

    const needsMfa = requiresMfa(currentRole);
    
    if (needsMfa && !hasMfaVerification) {
      await handleGenerateMfa();
      return;
    }

    const result = await revokeUserRole(targetUserId, reason, hasMfaVerification);
    
    if (result.success) {
      setReason('');
      setMfaInput('');
      onRoleChanged?.();
    }
  };

  const handleCancel = () => {
    resetMfaState();
    setShowMfaForm(false);
    setMfaInput('');
    setSelectedRole('');
    setReason('');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Secure Role Management
        </CardTitle>
        <CardDescription>
          Manage user roles for {targetUserName} with enhanced security controls
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Role Display */}
        <div className="space-y-2">
          <Label>Current Role</Label>
          <div className="flex items-center gap-2">
            <Badge variant={currentRole === 'super_admin' ? 'destructive' : currentRole === 'admin' ? 'default' : 'secondary'}>
              {currentRole ? ROLE_OPTIONS.find(r => r.value === currentRole)?.label || currentRole : 'No Role'}
            </Badge>
          </div>
        </div>

        {/* MFA Status */}
        {requiresMfa(selectedRole) && (
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Multi-factor authentication is required for admin role changes.
              {hasMfaVerification && (
                <Badge variant="outline" className="ml-2">
                  <Lock className="h-3 w-3 mr-1" />
                  MFA Verified
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* MFA Verification Form */}
        {showMfaForm && mfaToken && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                MFA Verification Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="mfa-token">Verification Token</Label>
                <div className="text-xs text-muted-foreground font-mono bg-gray-100 p-2 rounded border-l-4 border-amber-400">
                  {mfaToken}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mfa-input">Enter Verification Token</Label>
                <Input
                  id="mfa-input"
                  type="text"
                  value={mfaInput}
                  onChange={(e) => setMfaInput(e.target.value)}
                  placeholder="Paste verification token here"
                  className="font-mono"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleVerifyMfa} 
                  disabled={!mfaInput.trim() || isLoading}
                  size="sm"
                >
                  Verify MFA
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Assignment Form */}
        {!showMfaForm && (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-role">Assign New Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select a role to assign" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{role.label}</span>
                        {(role.value === 'super_admin' || role.value === 'admin') && (
                          <Key className="h-3 w-3 ml-2 text-amber-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Role Change</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for this role change..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAssignRole}
                disabled={!selectedRole || !reason.trim() || isLoading}
                className="flex-1"
              >
                {requiresMfa(selectedRole) && !hasMfaVerification ? 'Generate MFA & Assign' : 'Assign Role'}
              </Button>
              
              {currentRole && (
                <Button
                  variant="destructive"
                  onClick={handleRevokeRole}
                  disabled={!reason.trim() || isLoading}
                  className="flex-1"
                >
                  {requiresMfa(currentRole) && !hasMfaVerification ? 'Generate MFA & Revoke' : 'Revoke Role'}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Security Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            All role changes are logged for security audit. Admin and Super Admin role changes require MFA verification.
            Role assignments follow strict hierarchy rules and cannot be bypassed.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};