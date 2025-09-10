'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)

    // In production, you would send this to an external service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // logErrorToService(error)
    }
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'
  const isNetworkError =
    error.message.includes('fetch') || error.message.includes('network')
  const isServerError = error.digest || error.message.includes('500')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-destructive">
            {isNetworkError
              ? 'Connection Error'
              : isServerError
                ? 'Server Error'
                : 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {isNetworkError
              ? 'Unable to connect to the server. Please check your internet connection.'
              : isServerError
                ? 'The server encountered an error. Our team has been notified.'
                : 'An unexpected error occurred. We apologize for the inconvenience.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isDevelopment && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Error Details (Development)</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>
                  <strong>Message:</strong> {error.message}
                </div>
                {error.digest && (
                  <div>
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">
                      Stack Trace
                    </summary>
                    <pre className="text-xs mt-2 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={reset} className="w-full">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Page
            </Button>
            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Button variant="ghost" className="w-full">
                  Go Home
                </Button>
              </Link>
              <Link href="/projects" className="flex-1">
                <Button variant="ghost" className="w-full">
                  View Projects
                </Button>
              </Link>
            </div>
          </div>

          {/* Help text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              If this problem continues, please{' '}
              <button
                onClick={() => {
                  // In a real app, this might open a support modal or copy error info
                  navigator.clipboard
                    ?.writeText(
                      `Error: ${error.message}\nTimestamp: ${new Date().toISOString()}`
                    )
                    .then(() => alert('Error details copied to clipboard'))
                    .catch(() => console.log('Could not copy to clipboard'))
                }}
                className="underline hover:text-foreground"
              >
                report this issue
              </button>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
