import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Secure session storage hook that uses server-side session management
 * instead of localStorage for sensitive data
 */
export const useSecureSessionStorage = () => {
  
  // Store session data securely on the server
  const setSecureItem = useCallback(async (key: string, value: any): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('secure_session_data')
        .upsert({
          user_id: user.id,
          session_key: key,
          session_value: JSON.stringify(value)
        });
      
      if (error) {
        console.error('Failed to store secure session data:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Secure session storage error:', error);
      return false;
    }
  }, []);

  // Retrieve session data securely from the server
  const getSecureItem = useCallback(async (key: string): Promise<any | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('secure_session_data')
        .select('session_value')
        .eq('session_key', key)
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error) {
        console.error('Failed to retrieve secure session data:', error);
        return null;
      }
      
      return data ? JSON.parse(data.session_value) : null;
    } catch (error) {
      console.error('Secure session retrieval error:', error);
      return null;
    }
  }, []);

  // Remove secure session data
  const removeSecureItem = useCallback(async (key: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('secure_session_data')
        .delete()
        .eq('session_key', key)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Failed to remove secure session data:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Secure session removal error:', error);
      return false;
    }
  }, []);

  // Clear all secure session data
  const clearSecureSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('secure_session_data')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Failed to clear secure session data:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Secure session clear error:', error);
      return false;
    }
  }, []);

  // Auto-cleanup on session end
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear sensitive data on page unload
      clearSecureSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [clearSecureSession]);

  return {
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearSecureSession
  };
};