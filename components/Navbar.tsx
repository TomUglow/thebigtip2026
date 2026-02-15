'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Trophy, Menu, X, Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lobby', label: 'Lobby', icon: Trophy },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  return (
    <>
      <nav className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo + Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <Image
                src={theme === 'light' ? '/TBT_Logo_White.png' : '/TBT_Logo_Black.png'}
                alt="The Big Tip"
                width={120}
                height={36}
                className="h-9 w-auto"
              />
            </Link>

            {/* Desktop Nav Links */}
            {session && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
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
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {session && (
              <>
                {/* User Account (Desktop) */}
                <button
                  onClick={() => router.push('/account')}
                  className="hidden md:flex items-center gap-2 glass-card px-3 py-1.5 rounded-full hover:bg-card/70 transition-colors"
                >
                  <div className="w-7 h-7 brand-gradient rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium">{session.user?.name || 'User'}</span>
                </button>

                {/* Logout Button (Desktop) */}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="hidden md:block p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>

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
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
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
              <button
                onClick={() => {
                  router.push('/account')
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted/50 transition-colors mb-2"
              >
                <div className="w-8 h-8 brand-gradient rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {session.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">{session.user?.name || 'User'}</div>
                  <div className="text-xs text-muted-foreground">{session.user?.email}</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Sign Out</h3>
            <p className="text-muted-foreground mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
