// Secure console logging replacement
// Prevents sensitive data leaks in production builds

const isDevelopment = import.meta.env.DEV || 
                     import.meta.env.MODE === 'development' ||
                     window.location.hostname === 'localhost'

// Sensitive data patterns to detect and redact
const SENSITIVE_PATTERNS = [
  /[A-Za-z0-9+/]{40,}/g, // Long base64-like strings (tokens)
  /sk-[A-Za-z0-9]{20,}/g, // OpenAI API keys
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN patterns
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email patterns
  /password|token|key|secret|credential|auth/gi, // Sensitive keywords
]

const SENSITIVE_KEYS = [
  'password', 'token', 'key', 'secret', 'credential',
  'auth', 'session', 'cookie', 'api_key', 'access_token',
  'refresh_token', 'private', 'ssn'
]

function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })
    return sanitized
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(sanitizeData)
    }
    
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase()
      
      // Skip sensitive keys entirely
      if (SENSITIVE_KEYS.some(sensitiveKey => keyLower.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeData(value)
      }
    }
    return sanitized
  }
  
  return data
}

// Secure console replacement
export const secureConsole = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData)
      console.log(...sanitizedArgs)
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData)
      console.warn(...sanitizedArgs)
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but sanitize them
    const sanitizedArgs = args.map(sanitizeData)
    console.error(...sanitizedArgs)
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData)
      console.debug(...sanitizedArgs)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData)
      console.info(...sanitizedArgs)
    }
  }
}

// Development-only console for security testing
export const devConsole = {
  security: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[SECURITY]', ...args)
    }
  },
  
  audit: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[AUDIT]', ...args)
    }
  }
}