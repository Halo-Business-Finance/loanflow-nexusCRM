import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const ProductionSecurityHeaders: React.FC = () => {
  useEffect(() => {
    const applyProductionHeaders = () => {
      // Enhanced Content Security Policy for production
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://api.ipify.org",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co https://api.ipify.org https://maps.googleapis.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; ');

      // Apply CSP meta tag
      let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspMeta) {
        cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        document.head.appendChild(cspMeta);
      }
      cspMeta.setAttribute('content', cspDirectives);

      // Additional security headers via meta tags
      const securityHeaders = [
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-Frame-Options', content: 'DENY' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
        { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=(), payment=()' }
      ];

      securityHeaders.forEach(({ name, content }) => {
        let meta = document.querySelector(`meta[http-equiv="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('http-equiv', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    };

    // Apply headers immediately and refresh every 30 minutes
    applyProductionHeaders();
    const interval = setInterval(applyProductionHeaders, 30 * 60 * 1000);

    // Log security headers application
    supabase.rpc('log_enhanced_security_event', {
      p_event_type: 'production_security_headers_applied',
      p_severity: 'low',
      p_details: { timestamp: new Date().toISOString() }
    });

    return () => clearInterval(interval);
  }, []);

  return null;
};