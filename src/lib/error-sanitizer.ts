/**
 * Error message sanitizer to prevent information leakage in production
 */

export interface SanitizedError {
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface ErrorSanitizationConfig {
  isDevelopment?: boolean;
  logOriginalErrors?: boolean;
  includeStackTrace?: boolean;
  customMessages?: Record<string, string>;
}

class ErrorSanitizer {
  private config: ErrorSanitizationConfig;
  private genericMessages = {
    auth: 'Authentication failed. Please try again.',
    database: 'A data operation failed. Please try again.',
    network: 'Network error occurred. Please check your connection.',
    validation: 'Invalid input provided. Please check your data.',
    permission: 'You do not have permission to perform this action.',
    rate_limit: 'Too many requests. Please wait before trying again.',
    session: 'Session expired. Please log in again.',
    server: 'An unexpected error occurred. Please try again later.',
    unknown: 'An error occurred. Please try again.'
  };

  constructor(config: ErrorSanitizationConfig = {}) {
    this.config = {
      isDevelopment: !import.meta.env.PROD,
      logOriginalErrors: true,
      includeStackTrace: false,
      ...config
    };
  }

  /**
   * Sanitize error for client consumption
   */
  sanitizeError(error: any, context?: string): SanitizedError {
    const timestamp = new Date().toISOString();
    
    // Log original error for debugging (in development or if enabled)
    if (this.config.isDevelopment || this.config.logOriginalErrors) {
      console.error(`[${context || 'Unknown'}] Original error:`, error);
    }

    // In production, return generic messages
    if (!this.config.isDevelopment) {
      return {
        message: this.getGenericMessage(error),
        code: this.extractSafeErrorCode(error),
        timestamp
      };
    }

    // In development, return more detailed information
    return {
      message: error?.message || 'Unknown error',
      code: error?.code || error?.status || 'UNKNOWN',
      details: this.config.includeStackTrace ? {
        stack: error?.stack,
        context
      } : undefined,
      timestamp
    };
  }

  /**
   * Get appropriate generic message based on error type
   */
  private getGenericMessage(error: any): string {
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    const errorCode = (error?.code || error?.status || '').toString().toLowerCase();

    // Custom messages from config
    if (this.config.customMessages) {
      for (const [key, message] of Object.entries(this.config.customMessages)) {
        if (errorString.includes(key.toLowerCase()) || errorCode.includes(key.toLowerCase())) {
          return message;
        }
      }
    }

    // Authentication errors
    if (
      errorString.includes('auth') || 
      errorString.includes('unauthorized') ||
      errorString.includes('forbidden') ||
      errorCode.includes('401') ||
      errorCode.includes('403')
    ) {
      return this.genericMessages.auth;
    }

    // Database errors
    if (
      errorString.includes('database') ||
      errorString.includes('sql') ||
      errorString.includes('constraint') ||
      errorString.includes('duplicate') ||
      errorCode.includes('23')
    ) {
      return this.genericMessages.database;
    }

    // Network errors
    if (
      errorString.includes('network') ||
      errorString.includes('connection') ||
      errorString.includes('timeout') ||
      errorCode.includes('500') ||
      errorCode.includes('502') ||
      errorCode.includes('503')
    ) {
      return this.genericMessages.network;
    }

    // Validation errors
    if (
      errorString.includes('validation') ||
      errorString.includes('invalid') ||
      errorString.includes('required') ||
      errorCode.includes('400') ||
      errorCode.includes('422')
    ) {
      return this.genericMessages.validation;
    }

    // Permission errors
    if (
      errorString.includes('permission') ||
      errorString.includes('access denied') ||
      errorString.includes('not allowed')
    ) {
      return this.genericMessages.permission;
    }

    // Rate limiting
    if (
      errorString.includes('rate limit') ||
      errorString.includes('too many') ||
      errorCode.includes('429')
    ) {
      return this.genericMessages.rate_limit;
    }

    // Session errors
    if (
      errorString.includes('session') ||
      errorString.includes('expired') ||
      errorString.includes('invalid token')
    ) {
      return this.genericMessages.session;
    }

    // Server errors
    if (
      errorCode.includes('5') ||
      errorString.includes('server') ||
      errorString.includes('internal')
    ) {
      return this.genericMessages.server;
    }

    return this.genericMessages.unknown;
  }

  /**
   * Extract safe error codes that don't expose sensitive information
   */
  private extractSafeErrorCode(error: any): string | undefined {
    const code = error?.code || error?.status;
    if (!code) return undefined;

    const codeString = code.toString();

    // Only return standard HTTP status codes or predefined safe codes
    const safeCodePatterns = [
      /^[1-5]\d{2}$/, // HTTP status codes
      /^[A-Z_]+$/, // All caps error codes
      /^E\d+$/ // Error codes starting with E
    ];

    if (safeCodePatterns.some(pattern => pattern.test(codeString))) {
      return codeString;
    }

    return undefined;
  }

  /**
   * Sanitize multiple errors
   */
  sanitizeErrors(errors: any[], context?: string): SanitizedError[] {
    return errors.map(error => this.sanitizeError(error, context));
  }

  /**
   * Check if error should be logged for security monitoring
   */
  shouldLogForSecurity(error: any): boolean {
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    
    const securityPatterns = [
      'injection', 'xss', 'csrf', 'unauthorized access',
      'privilege escalation', 'malicious', 'attack',
      'brute force', 'suspicious activity'
    ];

    return securityPatterns.some(pattern => 
      errorString.includes(pattern.toLowerCase())
    );
  }
}

// Global error sanitizer instance
export const errorSanitizer = new ErrorSanitizer();

/**
 * Convenience function for sanitizing errors
 */
export const sanitizeError = (error: any, context?: string): SanitizedError => {
  return errorSanitizer.sanitizeError(error, context);
};

/**
 * Handle and sanitize errors with optional toast notification
 */
export const handleSanitizedError = (
  error: any, 
  context?: string,
  showToast?: (message: string) => void
): SanitizedError => {
  const sanitized = errorSanitizer.sanitizeError(error, context);
  
  // Log security-relevant errors
  if (errorSanitizer.shouldLogForSecurity(error)) {
    console.warn(`[SECURITY] ${context || 'Unknown'}: Potential security-related error detected`);
  }

  // Show toast if provided
  if (showToast) {
    showToast(sanitized.message);
  }

  return sanitized;
};