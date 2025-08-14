import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface SecureRingCentralAccount {
  id: string;
  user_id: string;
  client_id?: string;
  client_secret?: string;
  server_url: string;
  username?: string;
  extension?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSecureRingCentral = () => {
  const [accounts, setAccounts] = useState<SecureRingCentralAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSecureAccounts = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // First get the account IDs that belong to the user
      const { data: accountIds, error: idsError } = await supabase
        .from('ringcentral_accounts')
        .select('id')
        .eq('user_id', user.id);

      if (idsError) throw idsError;

      if (!accountIds?.length) {
        setAccounts([]);
        return;
      }

      // Then fetch secure data for each account using the secure function
      const secureAccounts: SecureRingCentralAccount[] = [];
      
      for (const { id } of accountIds) {
        const { data, error } = await supabase.rpc('get_masked_ringcentral_credentials', {
          p_account_id: id,
          p_requesting_user_id: user.id
        });

        if (error) {
          console.error('Error fetching RingCentral account:', error);
          continue;
        }

        if (data) {
          secureAccounts.push(data as unknown as SecureRingCentralAccount);
        }
      }

      setAccounts(secureAccounts);
    } catch (error) {
      console.error('Error fetching secure RingCentral accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch RingCentral accounts securely",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSecureAccount = async (accountData: {
    client_id: string;
    client_secret: string;
    server_url?: string;
    username: string;
    extension?: string;
  }) => {
    if (!user) return null;

    try {
      // Create account in main table (sensitive fields will be automatically encrypted)
      const { data: newAccount, error: createError } = await supabase
        .from('ringcentral_accounts')
        .insert({
          user_id: user.id,
          client_id: accountData.client_id,
          client_secret: accountData.client_secret, // Will be automatically encrypted by trigger
          server_url: accountData.server_url || 'https://platform.ringcentral.com',
          username: accountData.username, // Will be automatically encrypted by trigger
          extension: accountData.extension,
          is_active: true
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchSecureAccounts();
      
      toast({
        title: "Success",
        description: "RingCentral account created securely"
      });

      return newAccount;
    } catch (error) {
      console.error('Error creating secure RingCentral account:', error);
      toast({
        title: "Error",
        description: "Failed to create RingCentral account",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateSecureAccount = async (accountId: string, updates: {
    client_id?: string;
    client_secret?: string;
    server_url?: string;
    username?: string;
    extension?: string;
    is_active?: boolean;
  }) => {
    if (!user) return null;

    try {
      // Update account (sensitive fields will be automatically encrypted)
      const { data: updatedAccount, error: updateError } = await supabase
        .from('ringcentral_accounts')
        .update(updates)
        .eq('id', accountId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchSecureAccounts();
      
      toast({
        title: "Success",
        description: "RingCentral account updated securely"
      });

      return updatedAccount;
    } catch (error) {
      console.error('Error updating secure RingCentral account:', error);
      toast({
        title: "Error",
        description: "Failed to update RingCentral account",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteSecureAccount = async (accountId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('ringcentral_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchSecureAccounts();
      
      toast({
        title: "Success",
        description: "RingCentral account deleted securely"
      });

      return true;
    } catch (error) {
      console.error('Error deleting secure RingCentral account:', error);
      toast({
        title: "Error",
        description: "Failed to delete RingCentral account",
        variant: "destructive"
      });
      return false;
    }
  };

  const getDecryptedCredentials = async (accountId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_masked_ringcentral_credentials', {
        p_account_id: accountId,
        p_requesting_user_id: user.id
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting decrypted credentials:', error);
      toast({
        title: "Error",
        description: "Failed to access credentials",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchSecureAccounts();
    }
  }, [user]);

  return {
    accounts,
    isLoading,
    fetchSecureAccounts,
    createSecureAccount,
    updateSecureAccount,
    deleteSecureAccount,
    getDecryptedCredentials
  };
};