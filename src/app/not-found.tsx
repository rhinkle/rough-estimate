import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-muted-foreground mb-4">
            404
          </CardTitle>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button className="w-full">Go Home</Button>
            </Link>
            <Link href="/projects" className="w-full">
              <Button variant="outline" className="w-full">
                View Projects
              </Button>
            </Link>
            <Link href="/configuration" className="w-full">
              <Button variant="ghost" className="w-full">
                Configuration
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              If you believe this is an error, please{' '}
              <Link href="/" className="underline hover:text-foreground">
                contact support
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
