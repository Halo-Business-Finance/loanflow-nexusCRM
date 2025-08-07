// Production-safe logging utility
// Only logs in development mode or when explicitly enabled

const isDevelopment = import.meta.env.DEV || 
                     import.meta.env.MODE === 'development' ||
                     window.location.hostname === 'localhost'

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

class ProductionLogger {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = isDevelopment;
  }

  // Only log in development
  log(message: string, context?: LogContext) {
    if (this.isEnabled && !this.containsSensitiveData(message, context)) {
      console.log(`[${new Date().toISOString()}] ${message}`, context || '');
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.isEnabled && !this.containsSensitiveData(message, context)) {
      console.warn(`[${new Date().toISOString()}] ${message}`, context || '');
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    // Always log errors, but sanitize them
    const sanitizedContext = this.sanitizeContext(context);
    const sanitizedMessage = this.sanitizeMessage(message);
    
    if (this.isEnabled) {
      console.error(`[${new Date().toISOString()}] ${sanitizedMessage}`, error, sanitizedContext);
    } else {
      // In production, only log the sanitized message without sensitive details
      console.error(`[${new Date().toISOString()}] ${sanitizedMessage}`);
    }
  }

  // Security-focused logging that only works in development
  security(event: string, details?: any) {
    if (this.isEnabled) {
      console.log(`[SECURITY][${new Date().toISOString()}] ${event}`, details);
    }
  }

  // Debug logging - only in development
  debug(message: string, data?: any) {
    if (this.isEnabled) {
      console.debug(`[DEBUG][${new Date().toISOString()}] ${message}`, data);
    }
  }

  private containsSensitiveData(message: string, context?: LogContext): boolean {
    const sensitiveKeywords = [
      'password', 'token', 'key', 'secret', 'credential',
      'auth', 'session', 'cookie', 'api_key', 'access_token',
      'refresh_token', 'private', 'ssn', 'social_security'
    ];

    const messageCheck = sensitiveKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (context) {
      const contextString = JSON.stringify(context).toLowerCase();
      const contextCheck = sensitiveKeywords.some(keyword => 
        contextString.includes(keyword)
      );
      return messageCheck || contextCheck;
    }

    return messageCheck;
  }

  private sanitizeMessage(message: string): string {
    // Remove potential sensitive data patterns
    return message
      .replace(/[A-Za-z0-9+/]{20,}/g, '[REDACTED_TOKEN]') // Base64-like patterns
      .replace(/sk-[A-Za-z0-9]{20,}/g, '[REDACTED_API_KEY]') // OpenAI-style keys
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]') // SSN patterns
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]'); // Email patterns
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized: LogContext = {};
    
    for (const [key, value] of Object.entries(context)) {
      const keyLower = key.toLowerCase();
      
      // Skip sensitive keys entirely
      if (keyLower.includes('password') || 
          keyLower.includes('token') || 
          keyLower.includes('key') ||
          keyLower.includes('secret')) {
        continue;
      }
      
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else if (typeof value === 'object' && value !== null) {
        // Don't recurse deeply into objects to avoid performance issues
        sanitized[key] = '[OBJECT]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Method to enable/disable logging programmatically
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled && isDevelopment; // Never enable in production
  }
}

// Export singleton instance
export const logger = new ProductionLogger();

// Legacy console method replacements for gradual migration
export const secureLog = {
  log: (message: string, ...args: any[]) => logger.log(message, { data: args }),
  warn: (message: string, ...args: any[]) => logger.warn(message, { data: args }),
  error: (message: string, error?: Error) => logger.error(message, error),
  debug: (message: string, ...args: any[]) => logger.debug(message, args[0])
};