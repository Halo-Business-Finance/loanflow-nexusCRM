/**
 * Error message sanitization utility to prevent sensitive information leakage
 * and ensure consistent, secure error handling across the application
 */

interface SanitizedError {
  userMessage: string;
  logMessage: string;
  errorCode: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorSanitizer {
  private static instance: ErrorSanitizer;
  
  // Patterns that indicate sensitive information
  private sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /credential/gi,
    /session/gi,
    /auth/gi,
    /api[_-]?key/gi,
    /bearer/gi,
    /jwt/gi,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{3}[.-]?\d{3}[.-]?\d{4}\b/g, // Phone numbers
    /\b\d{4}[.-]?\d{4}[.-]?\d{4}[.-]?\d{4}\b/g, // Credit card numbers
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  ];

  // Common error messages that should be sanitized
  private errorMappings: Record<string, { userMessage: string; severity: SanitizedError['severity'] }> = {
    'authentication failed': {
      userMessage: 'Authentication failed. Please check your credentials and try again.',
      severity: 'medium'
    },
    'access denied': {
      userMessage: 'You do not have permission to perform this action.',
      severity: 'medium'
    },
    'database connection': {
      userMessage: 'Service temporarily unavailable. Please try again later.',
      severity: 'high'
    },
    'rate limit': {
      userMessage: 'Too many requests. Please wait a moment and try again.',
      severity: 'low'
    },
    'validation failed': {
      userMessage: 'Please check your input and try again.',
      severity: 'low'
    },
    'network error': {
      userMessage: 'Connection error. Please check your internet connection.',
      severity: 'medium'
    },
    'unauthorized': {
      userMessage: 'Session expired. Please sign in again.',
      severity: 'medium'
    },
    'forbidden': {
      userMessage: 'Access to this resource is not allowed.',
      severity: 'medium'
    },
    'not found': {
      userMessage: 'The requested resource was not found.',
      severity: 'low'
    },
    'server error': {
      userMessage: 'An unexpected error occurred. Please try again later.',
      severity: 'high'
    }
  };

  private constructor() {}

  static getInstance(): ErrorSanitizer {
    if (!ErrorSanitizer.instance) {
      ErrorSanitizer.instance = new ErrorSanitizer();
    }
    return ErrorSanitizer.instance;
  }

  /**
   * Sanitize an error for safe display to users
   */
  sanitizeError(error: Error | string | unknown): SanitizedError {
    const errorString = this.extractErrorString(error);
    const lowercaseError = errorString.toLowerCase();
    
    // Check for known error patterns
    for (const [pattern, mapping] of Object.entries(this.errorMappings)) {
      if (lowercaseError.includes(pattern)) {
        return {
          userMessage: mapping.userMessage,
          logMessage: this.sanitizeForLogging(errorString),
          errorCode: this.generateErrorCode(pattern),
          severity: mapping.severity
        };
      }
    }

    // Default sanitization for unknown errors
    return {
      userMessage: 'An unexpected error occurred. Please try again later.',
      logMessage: this.sanitizeForLogging(errorString),
      errorCode: this.generateErrorCode('unknown'),
      severity: 'medium'
    };
  }

  /**
   * Sanitize error message for safe logging (removes sensitive data but keeps context)
   */
  private sanitizeForLogging(errorString: string): string {
    let sanitized = errorString;
    
    // Replace sensitive patterns with placeholders
    this.sensitivePatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Truncate very long messages
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + '...[TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Extract error string from various error types
   */
  private extractErrorString(error: unknown): string {
    if (error instanceof Error) {
      return error.message || error.toString();
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      // Handle common error object structures
      const errorObj = error as any;
      return errorObj.message || errorObj.error || errorObj.details || JSON.stringify(error);
    }
    
    return String(error);
  }

  /**
   * Generate a consistent error code for tracking
   */
  private generateErrorCode(pattern: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const hash = this.simpleHash(pattern);
    return `ERR_${hash}_${timestamp}`;
  }

  /**
   * Simple hash function for error codes
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 6).toUpperCase();
  }

  /**
   * Check if an error message contains sensitive information
   */
  containsSensitiveInfo(message: string): boolean {
    return this.sensitivePatterns.some(pattern => pattern.test(message));
  }

  /**
   * Create a safe error for API responses
   */
  createSafeApiError(error: unknown, defaultMessage = 'An error occurred'): {
    error: string;
    code: string;
  } {
    const sanitized = this.sanitizeError(error);
    return {
      error: sanitized.userMessage || defaultMessage,
      code: sanitized.errorCode
    };
  }
}

// Export singleton instance
export const errorSanitizer = ErrorSanitizer.getInstance();

// Utility function for common use cases
export const sanitizeError = (error: unknown): SanitizedError => {
  return errorSanitizer.sanitizeError(error);
};

// Helper function for handling sanitized errors with callback
export const handleSanitizedError = (
  error: unknown, 
  context?: string, 
  callback?: (message: string) => void
): SanitizedError => {
  const sanitized = errorSanitizer.sanitizeError(error);
  
  // Log full error details for debugging (sanitized)
  console.error(`Error in ${context || 'unknown context'}:`, sanitized.logMessage);
  
  // Call callback with user-safe message if provided
  if (callback) {
    callback(sanitized.userMessage);
  }
  
  return sanitized;
};

// Hook for React components
export const useErrorSanitizer = () => {
  return {
    sanitizeError: errorSanitizer.sanitizeError.bind(errorSanitizer),
    containsSensitiveInfo: errorSanitizer.containsSensitiveInfo.bind(errorSanitizer),
    createSafeApiError: errorSanitizer.createSafeApiError.bind(errorSanitizer),
    handleSanitizedError
  };
};