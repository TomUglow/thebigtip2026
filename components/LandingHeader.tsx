import Link from 'next/link'

export default function LandingHeader() {
  return (
    <header className="border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-black text-lg tracking-tight">The Big Tip</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg bg-primary hover:bg-primary/90 transition-colors"
          >
            Join Free
          </Link>
        </div>
      </div>
    </header>
  )
}
