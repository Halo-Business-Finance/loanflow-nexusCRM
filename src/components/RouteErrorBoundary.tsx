import React from 'react'
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = 'Something went wrong'
  let description = 'An unexpected error occurred while loading this page.'
  let statusCode: number | undefined

  if (isRouteErrorResponse(error)) {
    statusCode = error.status
    title = `${error.status} ${error.statusText}`
    description = error.data?.message || 'An error occurred while loading this page.'
    
    if (error.status === 404) {
      title = 'Page Not Found'
      description = 'The page you are looking for does not exist or has been moved.'
    } else if (error.status === 403) {
      title = 'Access Forbidden'
      description = 'You do not have permission to access this page.'
    } else if (error.status === 500) {
      title = 'Server Error'
      description = 'An internal server error occurred. Please try again later.'
    }
  } else if (error instanceof Error) {
    description = error.message
  }

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {statusCode && (
            <div className="text-2xl font-bold text-muted-foreground mt-2">
              {statusCode}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <details className="text-sm bg-muted p-3 rounded-md overflow-auto max-h-32">
              <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
              <pre className="whitespace-pre-wrap text-xs">
                {error.stack}
              </pre>
            </details>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleGoBack} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}