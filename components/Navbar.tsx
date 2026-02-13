'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Trophy, Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lobby', label: 'Lobby', icon: Trophy },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo + Nav Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 brand-gradient rounded-xl flex items-center justify-center font-black text-sm shadow-lg text-white">
              TBT
            </div>
            <div className="font-black text-xl tracking-tight">
              <span className="text-[0.6rem] font-light block -mb-1 text-foreground/70">the</span>
              <span className="text-gradient">BIG TIP</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {session && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-semibold transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {session && (
            <>
              {/* Desktop User */}
              <div className="hidden md:flex items-center gap-2 glass-card px-3 py-1.5 rounded-full">
                <div className="w-7 h-7 brand-gradient rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {session.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium">{session.user?.name || 'User'}</span>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && session && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 brand-gradient rounded-full flex items-center justify-center text-xs font-bold text-white">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-sm font-semibold">{session.user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground">{session.user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
