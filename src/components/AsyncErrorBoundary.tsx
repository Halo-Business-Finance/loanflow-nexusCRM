import React, { ReactNode, useEffect, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

export function AsyncErrorBoundary({ children, fallback, onError }: AsyncErrorBoundaryProps) {
  const [asyncError, setAsyncError] = useState<Error | null>(null)

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Convert promise rejection to Error if it isn't already
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      setAsyncError(error)
      onError?.(error)
      
      // Prevent the default browser handling
      event.preventDefault()
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      
      const error = event.error instanceof Error 
        ? event.error 
        : new Error(event.message)
      
      setAsyncError(error)
      onError?.(error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [onError])

  // Reset async error when children change
  useEffect(() => {
    setAsyncError(null)
  }, [children])

  if (asyncError) {
    throw asyncError
  }

  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}