'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<unknown>
  resetOnPropsChange?: boolean
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  resetKeys?: Array<unknown>
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">
            Something went wrong
          </CardTitle>
          <CardDescription>
            An error occurred while rendering this component. Please try
            refreshing the page or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Error Details (Development)</h4>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={resetError} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log to external error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props
    const prevResetKeys = prevProps.resetKeys

    if (
      this.state.hasError &&
      prevResetKeys !== resetKeys &&
      resetKeys?.some((key, index) => key !== prevResetKeys?.[index])
    ) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      })
    }, 0)
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real application, you would log to a service like Sentry, LogRocket, etc.
    // For now, we'll just log to console in production as well
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      // Example: Send to external service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData),
      // }).catch(() => {
      //   // Silently fail if error reporting fails
      // })

      console.error('Error logged:', errorData)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetErrorBoundary}
          resetKeys={this.props.resetKeys}
        />
      )
    }

    return this.props.children
  }
}

// Hook for easier error boundary usage
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error)
    setError(errorObj)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Higher-order component for easier wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ))

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Specific error boundary for async operations
export function AsyncErrorBoundary({
  children,
  onError,
}: {
  children: React.ReactNode
  onError?: (error: Error) => void
}) {
  return (
    <ErrorBoundary
      fallback={({ error: _error, resetError }) => (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-destructive">Loading Error</CardTitle>
              <CardDescription>
                Failed to load data. Please check your connection and try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={resetError} variant="outline" size="sm">
                  Retry
                </Button>
                <Button onClick={() => window.location.reload()} size="sm">
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}
