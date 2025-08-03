import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityHeader {
  header_name: string;
  header_value: string;
  is_active: boolean;
}

export const CSPHeaders: React.FC = () => {
  useEffect(() => {
    // Fetch and apply security headers
    const applySecurityHeaders = async () => {
      try {
        const { data: headers } = await supabase
          .from('security_headers')
          .select('*')
          .eq('is_active', true);

        if (headers) {
          headers.forEach((header: SecurityHeader) => {
            // Apply CSP via meta tag for browsers that support it
            if (header.header_name === 'Content-Security-Policy') {
              // Remove existing CSP meta tag
              const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
              if (existingCSP) {
                existingCSP.remove();
              }
              
              // Create new CSP meta tag
              const metaCSP = document.createElement('meta');
              metaCSP.setAttribute('http-equiv', 'Content-Security-Policy');
              metaCSP.setAttribute('content', header.header_value);
              document.head.appendChild(metaCSP);
              
              console.log('Applied CSP:', header.header_value);
            }
          });
        }
      } catch (error) {
        console.error('Failed to apply security headers:', error);
      }
    };

    applySecurityHeaders();
    
    // Refresh CSP every 10 seconds to catch updates
    const interval = setInterval(applySecurityHeaders, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
};