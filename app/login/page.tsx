'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function LoginPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [showMfaField, setShowMfaField] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        totp: totp || '',
        redirect: false,
      })

      if (result?.error === 'MFA_REQUIRED') {
        setShowMfaField(true)
        setError('')
      } else if (result?.error === 'MFA_INVALID') {
        setError('Invalid authenticator code. Please try again.')
        setTotp('')
      } else if (result?.error) {
        setError('Invalid email or password')
        setShowMfaField(false)
        setTotp('')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src={theme === 'light' ? '/TBT_Logo_White.png' : '/TBT_Logo_Black.png'}
            alt="The Big Tip"
            width={240}
            height={120}
            className="h-28 w-auto mx-auto mb-4"
          />
          <p className="text-muted-foreground font-display">Sign in to your account</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
                placeholder="••••••••"
                required
              />
            </div>

            {showMfaField && (
              <div>
                <label htmlFor="totp" className="block text-sm font-semibold mb-2">
                  Authenticator Code
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Enter the 6-digit code from your authenticator app.
                </p>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground tracking-widest text-center text-lg"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 brand-gradient text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : showMfaField ? 'Verify Code' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-primary font-semibold hover:underline">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
