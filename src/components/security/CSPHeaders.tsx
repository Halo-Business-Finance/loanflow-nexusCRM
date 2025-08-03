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
              let metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
              if (!metaCSP) {
                metaCSP = document.createElement('meta');
                metaCSP.setAttribute('http-equiv', 'Content-Security-Policy');
                document.head.appendChild(metaCSP);
              }
              metaCSP.setAttribute('content', header.header_value);
            }
          });
        }
      } catch (error) {
        console.error('Failed to apply security headers:', error);
      }
    };

    applySecurityHeaders();
  }, []);

  return null; // This component doesn't render anything
};