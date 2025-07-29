import { ReactNode, useEffect } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

// Simple wrapper that just uses ErrorBoundary for now
// This eliminates any complex React hook issues
export function AsyncErrorBoundary({ children, fallback, onError }: AsyncErrorBoundaryProps) {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Convert promise rejection to Error if it isn't already
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      onError?.(error)
      
      // Prevent the default browser handling
      event.preventDefault()
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      
      const error = event.error instanceof Error 
        ? event.error 
        : new Error(event.message)
      
      onError?.(error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [onError])

  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}