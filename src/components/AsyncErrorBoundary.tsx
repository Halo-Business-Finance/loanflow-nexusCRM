import React, { ReactNode, Component, ErrorInfo } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

interface AsyncErrorBoundaryState {
  asyncError: Error | null
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props)
    this.state = { asyncError: null }
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    window.addEventListener('error', this.handleError)
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    window.removeEventListener('error', this.handleError)
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Convert promise rejection to Error if it isn't already
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason))
    
    this.setState({ asyncError: error })
    this.props.onError?.(error)
    
    // Prevent the default browser handling
    event.preventDefault()
  }

  handleError = (event: ErrorEvent) => {
    console.error('Unhandled error:', event.error)
    
    const error = event.error instanceof Error 
      ? event.error 
      : new Error(event.message)
    
    this.setState({ asyncError: error })
    this.props.onError?.(error)
  }

  static getDerivedStateFromError(error: Error) {
    return { asyncError: error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.asyncError) {
      // Re-throw to let ErrorBoundary handle it
      throw this.state.asyncError
    }

    return (
      <ErrorBoundary fallback={this.props.fallback} onError={this.props.onError}>
        {this.props.children}
      </ErrorBoundary>
    )
  }
}