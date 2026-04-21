import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center space-y-4">
        <h1 className="font-display text-6xl text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link href="/" className="text-primary text-sm underline underline-offset-4">
          Go back home
        </Link>
      </div>
    </div>
  )
}
