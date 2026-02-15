'use client'

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

// Sample sports and teams data - you can replace this with actual data
const SPORTS_DATA: Record<string, string[]> = {
  'NFL': ['Kansas City Chiefs', 'San Francisco 49ers', 'Buffalo Bills', 'Dallas Cowboys'],
  'NBA': ['Boston Celtics', 'Los Angeles Lakers', 'Denver Nuggets', 'Golden State Warriors'],
  'EPL': ['Manchester City', 'Liverpool', 'Arsenal', 'Manchester United'],
  'AFL': ['Melbourne Demons', 'Geelong Cats', 'Brisbane Lions', 'Richmond Tigers'],
  'NRL': ['Penrith Panthers', 'Melbourne Storm', 'Parramatta Eels', 'Sydney Roosters'],
}

interface FormData {
  name: string
  username: string
  email: string
  mobile: string
  postcode: string
  password: string
  confirmPassword: string
  favoriteTeams: Array<{ sport: string; team: string }>
}

interface FormErrors {
  [key: string]: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    mobile: '',
    postcode: '',
    password: '',
    confirmPassword: '',
    favoriteTeams: [],
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set())

  // Debounced username check
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
      const data = await response.json()
      setUsernameAvailable(data.available)
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))

    // Check username availability when username changes
    if (name === 'username') {
      checkUsername(value)
    }
  }

  const toggleSport = (sport: string) => {
    setExpandedSports((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sport)) {
        newSet.delete(sport)
      } else {
        newSet.add(sport)
      }
      return newSet
    })
  }

  const toggleTeam = (sport: string, team: string) => {
    setFormData((prev) => {
      const existing = prev.favoriteTeams.find((t) => t.sport === sport && t.team === team)
      if (existing) {
        return {
          ...prev,
          favoriteTeams: prev.favoriteTeams.filter((t) => !(t.sport === sport && t.team === team)),
        }
      } else {
        return {
          ...prev,
          favoriteTeams: [...prev.favoriteTeams, { sport, team }],
        }
      }
    })
  }

  const isTeamSelected = (sport: string, team: string) => {
    return formData.favoriteTeams.some((t) => t.sport === sport && t.team === team)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: FormErrors = {}

    // Validation
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    if (usernameAvailable === false) newErrors.username = 'Username is already taken'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          mobile: formData.mobile || undefined,
          postcode: formData.postcode || undefined,
          password: formData.password,
          favoriteTeams: formData.favoriteTeams,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        newErrors.form = data.error || 'Registration failed'
        setErrors(newErrors)
        return
      }

      // Auto-sign in
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setErrors({ form: 'Account created but sign in failed. Please log in manually.' })
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Image
            src={theme === 'light' ? '/TBT_Logo_White.png' : '/TBT_Logo_Black.png'}
            alt="The Big Tip"
            width={240}
            height={120}
            className="h-28 w-auto mx-auto mb-4"
          />
          <p className="text-muted-foreground font-display">Create your account</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {errors.form}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                  errors.name ? 'border-red-500/50' : 'border-border focus:border-primary'
                }`}
                placeholder="Your name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                    errors.username ? 'border-red-500/50' : 'border-border focus:border-primary'
                  }`}
                  placeholder="3-20 characters, letters/numbers/underscore"
                />
                {checkingUsername && <span className="absolute right-3 top-3 text-muted-foreground text-sm">Checking...</span>}
                {usernameAvailable === true && <span className="absolute right-3 top-3 text-green-500 text-sm">✓ Available</span>}
                {usernameAvailable === false && !checkingUsername && (
                  <span className="absolute right-3 top-3 text-red-500 text-sm">✗ Taken</span>
                )}
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                  errors.email ? 'border-red-500/50' : 'border-border focus:border-primary'
                }`}
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Mobile (Optional) */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold mb-2">
                Mobile <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                id="mobile"
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Postcode (Optional) */}
            <div>
              <label htmlFor="postcode" className="block text-sm font-semibold mb-2">
                Postcode <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                id="postcode"
                type="text"
                name="postcode"
                value={formData.postcode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
                placeholder="e.g., 2000"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                  errors.password ? 'border-red-500/50' : 'border-border focus:border-primary'
                }`}
                placeholder="Min. 8 characters"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                  errors.confirmPassword ? 'border-red-500/50' : 'border-border focus:border-primary'
                }`}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Favorite Sports & Teams */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                Favorite Sports & Teams <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <div className="space-y-2">
                {Object.entries(SPORTS_DATA).map(([sport, teams]) => (
                  <div key={sport} className="border border-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="font-semibold text-sm">{sport}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${expandedSports.has(sport) ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {expandedSports.has(sport) && (
                      <div className="px-4 py-3 space-y-2 bg-background border-t border-border">
                        {teams.map((team) => (
                          <label key={team} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isTeamSelected(sport, team)}
                              onChange={() => toggleTeam(sport, team)}
                              className="rounded border-border"
                            />
                            <span className="text-sm">{team}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {formData.favoriteTeams.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.favoriteTeams.map((fav) => (
                    <div key={`${fav.sport}-${fav.team}`} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs">
                      <span>{fav.team}</span>
                      <button
                        type="button"
                        onClick={() => toggleTeam(fav.sport, fav.team)}
                        className="text-primary hover:opacity-70"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || usernameAvailable === false}
              className="w-full py-3 brand-gradient text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
