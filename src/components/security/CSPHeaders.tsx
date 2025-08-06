import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { applyClientSecurityHeaders } from '@/lib/security-headers';

interface SecurityHeader {
  header_name: string;
  header_value: string;
  is_active: boolean;
}

export const CSPHeaders: React.FC = () => {
  useEffect(() => {
    // Apply enhanced client-side security headers
    applyClientSecurityHeaders();
    
    // Fetch and apply dynamic security headers from database
    const applyDynamicSecurityHeaders = async () => {
      try {
        const { data: headers } = await supabase
          .from('security_headers')
          .select('*')
          .eq('is_active', true);

        if (headers) {
          headers.forEach((header: SecurityHeader) => {
            // Apply CSP via meta tag for browsers that support it
            if (header.header_name === 'Content-Security-Policy') {
              // Remove existing dynamic CSP meta tag
              const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"][data-dynamic="true"]');
              if (existingCSP) {
                existingCSP.remove();
              }
              
              // Create new dynamic CSP meta tag
              const metaCSP = document.createElement('meta');
              metaCSP.setAttribute('http-equiv', 'Content-Security-Policy');
              metaCSP.setAttribute('content', header.header_value);
              metaCSP.setAttribute('data-dynamic', 'true');
              document.head.appendChild(metaCSP);
              
              console.log('Applied dynamic CSP:', header.header_value);
            }
          });
        }
      } catch (error) {
        console.error('Failed to apply dynamic security headers:', error);
      }
    };

    applyDynamicSecurityHeaders();
    
    // Refresh dynamic headers every 10 seconds to catch updates
    const interval = setInterval(applyDynamicSecurityHeaders, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
};