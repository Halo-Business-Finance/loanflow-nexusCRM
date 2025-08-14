import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecureProfiles } from "@/hooks/useSecureProfiles";
import { useAuth } from "@/components/auth/AuthProvider";

interface SecureProfileDisplayProps {
  profileId: string;
  fields?: ('first_name' | 'last_name' | 'email' | 'phone_number' | 'job_title')[];
  showSecurityIndicator?: boolean;
  compact?: boolean;
}

export const SecureProfileDisplay: React.FC<SecureProfileDisplayProps> = ({ 
  profileId, 
  fields = ['first_name', 'last_name', 'email'], 
  showSecurityIndicator = true,
  compact = false
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState(false);
  const { getMaskedProfile } = useSecureProfiles();
  const { user, userRole } = useAuth();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getMaskedProfile(profileId);
        setProfileData(data);
      } catch (error) {
        console.error('Error loading secure profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (profileId) {
      loadProfile();
    }
  }, [profileId, getMaskedProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading secure data...</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span className="text-sm">Access denied</span>
      </div>
    );
  }

  const isOwnProfile = user?.id === profileId;
  const canViewSensitive = isOwnProfile || ['admin', 'super_admin'].includes(userRole || '');

  const renderField = (fieldName: string, value: string | undefined) => {
    if (!value) return null;

    const isSensitive = ['email', 'phone_number'].includes(fieldName);
    const displayValue = (isSensitive && !showSensitive) ? 
      value.includes('*') ? value : `${value.substring(0, 3)}***` : 
      value;

    return (
      <div key={fieldName} className={compact ? "inline" : "space-y-1"}>
        {!compact && (
          <div className="text-xs font-medium text-muted-foreground capitalize">
            {fieldName.replace('_', ' ')}
            {isSensitive && showSecurityIndicator && (
              <Shield className="inline h-3 w-3 ml-1 text-amber-500" />
            )}
          </div>
        )}
        <div className={`${compact ? 'inline-block mr-2' : 'text-sm'} flex items-center gap-1`}>
          <span>{displayValue}</span>
          {isSensitive && canViewSensitive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => setShowSensitive(!showSensitive)}
            >
              {showSensitive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getSecurityLevel = () => {
    if (isOwnProfile) return { level: 'Full Access', color: 'bg-green-500' };
    if (userRole === 'super_admin') return { level: 'Full Access', color: 'bg-green-500' };
    if (['admin', 'manager'].includes(userRole || '')) return { level: 'Masked', color: 'bg-yellow-500' };
    return { level: 'Minimal', color: 'bg-red-500' };
  };

  const security = getSecurityLevel();

  return (
    <div className={`space-y-2 ${compact ? 'inline-block' : ''}`}>
      {showSecurityIndicator && !compact && (
        <div className="flex items-center gap-2 text-xs">
          <Shield className="h-3 w-3" />
          <Badge variant="outline" className="text-xs">
            <div className={`w-2 h-2 rounded-full mr-1 ${security.color}`} />
            {security.level}
          </Badge>
        </div>
      )}
      
      <div className={compact ? "flex flex-wrap gap-2" : "space-y-2"}>
        {fields.map(field => renderField(field, profileData[field]))}
      </div>
      
      {showSecurityIndicator && compact && (
        <Badge variant="outline" className="ml-2 text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Protected
        </Badge>
      )}
    </div>
  );
};