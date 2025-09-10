import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rough Estimate - Project Estimation Tool',
  description:
    'A web application for estimating software project timelines using predefined task types and customizable time estimates.',
}

function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-xl font-bold">Rough Estimate</h1>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  Projects
                </Button>
              </Link>
              <Link href="/configuration">
                <Button variant="ghost" size="sm">
                  Configuration
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/projects/new">
              <Button size="sm">New Project</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <ErrorBoundary>
            <Navigation />
          </ErrorBoundary>
          <main className="flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <footer className="border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-sm text-muted-foreground">
                Rough Estimate - Project Estimation Tool
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
