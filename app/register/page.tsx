'use client'

import { useState, useCallback, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Check, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface SportEntry {
  sport: string
  teams: string[]
  hasTeams: boolean
}

interface FormData {
  // Step 1
  name: string
  email: string
  mobile: string
  postcode: string
  // Step 2
  username: string
  password: string
  confirmPassword: string
  // Step 3
  favoriteTeams: Array<{ sport: string; team: string }>
  ageVerified: boolean
  termsAccepted: boolean
}

interface FormErrors {
  [key: string]: string
}

const STEPS = [
  { label: 'You', heading: 'Who are you?', sub: "Step 1 of 3 — Let's get started" },
  { label: 'Account', heading: 'Lock in your account', sub: 'Step 2 of 3 — Almost there' },
  { label: 'Teams', heading: 'Pick your teams', sub: 'Step 3 of 3 — The fun part' },
]

function formatMobileDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (password.length === 0) return { level: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++
  if (score === 1) return { level: 1, label: 'Weak' }
  if (score === 2) return { level: 2, label: 'Fair' }
  return { level: 3, label: 'Strong' }
}

export default function RegisterPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    mobile: '',
    postcode: '',
    username: '',
    password: '',
    confirmPassword: '',
    favoriteTeams: [],
    ageVerified: false,
    termsAccepted: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [mobileAvailable, setMobileAvailable] = useState<boolean | null>(null)
  const [checkingMobile, setCheckingMobile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Step 3 sports/teams state
  const [sportsData, setSportsData] = useState<SportEntry[]>([])
  const [loadingSports, setLoadingSports] = useState(false)
  const [sportsFetchError, setSportsFetchError] = useState(false)
  const [activeSport, setActiveSport] = useState<string | null>(null)

  // Fetch sports/teams when reaching step 3
  useEffect(() => {
    if (step !== 2 || sportsData.length > 0 || loadingSports) return
    setLoadingSports(true)
    setSportsFetchError(false)
    fetch('/api/events/sports-teams')
      .then((res) => res.json())
      .then((data) => {
        if (data.sports && data.sports.length > 0) {
          setSportsData(data.sports)
          setActiveSport(data.sports[0].sport)
        }
      })
      .catch(() => setSportsFetchError(true))
      .finally(() => setLoadingSports(false))
  }, [step, sportsData.length, loadingSports])

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
    } catch {
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }, [])

  const checkMobile = useCallback(async (mobile: string) => {
    const digits = mobile.replace(/\D/g, '')
    if (digits.length < 10) {
      setMobileAvailable(null)
      return
    }
    setCheckingMobile(true)
    try {
      const response = await fetch(`/api/auth/check-mobile?mobile=${encodeURIComponent(digits)}`)
      const data = await response.json()
      setMobileAvailable(data.available)
    } catch {
      setMobileAvailable(null)
    } finally {
      setCheckingMobile(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }))
      setErrors((prev) => ({ ...prev, [name]: '' }))
      return
    }

    if (name === 'mobile') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      const formatted = formatMobileDisplay(digits)
      setFormData((prev) => ({ ...prev, mobile: formatted }))
      setErrors((prev) => ({ ...prev, mobile: '' }))
      checkMobile(digits)
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))

    if (name === 'username') {
      checkUsername(value)
    }
  }

  const toggleTeam = (sport: string, team: string) => {
    setFormData((prev) => {
      const existing = prev.favoriteTeams.find((t) => t.sport === sport && t.team === team)
      if (existing) {
        return { ...prev, favoriteTeams: prev.favoriteTeams.filter((t) => !(t.sport === sport && t.team === team)) }
      }
      return { ...prev, favoriteTeams: [...prev.favoriteTeams, { sport, team }] }
    })
  }

  const isTeamSelected = (sport: string, team: string) =>
    formData.favoriteTeams.some((t) => t.sport === sport && t.team === team)

  const isSportSelected = (sport: string) =>
    formData.favoriteTeams.some((t) => t.sport === sport)

  const validateStep = (stepIndex: number): FormErrors => {
    const newErrors: FormErrors = {}

    if (stepIndex === 0) {
      if (!formData.name.trim() || formData.name.trim().length < 2) newErrors.name = 'Full name is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
      const mobileDigits = formData.mobile.replace(/\D/g, '')
      if (!mobileDigits) newErrors.mobile = 'Mobile number is required'
      else if (!/^04\d{8}$/.test(mobileDigits)) newErrors.mobile = 'Enter a valid Australian mobile (04XX XXX XXX)'
      else if (mobileAvailable === false) newErrors.mobile = 'This mobile is already registered to an account'
      if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required'
      else if (!/^\d{4}$/.test(formData.postcode.trim())) newErrors.postcode = 'Enter a valid 4-digit postcode'
    }

    if (stepIndex === 1) {
      if (!formData.username.trim()) newErrors.username = 'Username is required'
      if (usernameAvailable === false) newErrors.username = 'Username is already taken'
      if (!formData.password) newErrors.password = 'Password is required'
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    }

    if (stepIndex === 2) {
      if (!formData.ageVerified) newErrors.ageVerified = 'You must confirm you are 18 or over'
      if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the Terms & Conditions'
    }

    return newErrors
  }

  const handleNext = () => {
    const stepErrors = validateStep(step)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    setErrors({})
    setStep((s) => s - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const stepErrors = validateStep(2)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setLoading(true)
    try {
      const mobileDigits = formData.mobile.replace(/\D/g, '')
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username,
          email: formData.email,
          mobile: mobileDigits,
          postcode: formData.postcode.trim(),
          password: formData.password,
          ageVerified: true,
          termsAccepted: true,
          favoriteTeams: formData.favoriteTeams,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ form: data.error || 'Registration failed' })
        return
      }

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
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const activeEntry = sportsData.find((s) => s.sport === activeSport)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <Image
            src={theme === 'light' ? '/TBT_Logo_White.png' : '/TBT_Logo_Black.png'}
            alt="The Big Tip"
            width={200}
            height={100}
            className="h-20 w-auto mx-auto mb-4"
          />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < step
                      ? 'brand-gradient text-white'
                      : i === step
                      ? 'brand-gradient text-white shadow-lg shadow-brand-red/40'
                      : 'bg-muted border border-border text-muted-foreground'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-300 ${
                    i < step ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Step heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-display">{STEPS[step].heading}</h1>
            <p className="text-muted-foreground text-sm mt-1">{STEPS[step].sub}</p>
          </div>

          {errors.form && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ── Step 1: Personal Details ── */}
            {step === 0 && (
              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    Full Name
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
                    placeholder="Jane Smith"
                    autoComplete="name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
                    placeholder="jane@example.com"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Mobile */}
                <div>
                  <label htmlFor="mobile" className="block text-sm font-semibold mb-2">
                    Mobile
                  </label>
                  <div className="relative">
                    <input
                      id="mobile"
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                        errors.mobile ? 'border-red-500/50' : 'border-border focus:border-primary'
                      }`}
                      placeholder="0400 000 000"
                      autoComplete="tel"
                    />
                    {checkingMobile && (
                      <span className="absolute right-3 top-3.5 text-muted-foreground text-xs">Checking...</span>
                    )}
                    {mobileAvailable === true && !checkingMobile && (
                      <span className="absolute right-3 top-3.5 text-green-500 text-xs">✓ Available</span>
                    )}
                    {mobileAvailable === false && !checkingMobile && (
                      <span className="absolute right-3 top-3.5 text-red-500 text-xs">✗ Already registered</span>
                    )}
                  </div>
                  {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                </div>

                {/* Postcode */}
                <div>
                  <label htmlFor="postcode" className="block text-sm font-semibold mb-2">
                    Postcode
                  </label>
                  <input
                    id="postcode"
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    maxLength={4}
                    className={`w-full px-4 py-3 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                      errors.postcode ? 'border-red-500/50' : 'border-border focus:border-primary'
                    }`}
                    placeholder="2000"
                    autoComplete="postal-code"
                  />
                  {errors.postcode && <p className="text-red-500 text-xs mt-1">{errors.postcode}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 brand-gradient text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all mt-2"
                >
                  Next →
                </button>
              </div>
            )}

            {/* ── Step 2: Account Setup ── */}
            {step === 1 && (
              <div className="space-y-5">
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
                      placeholder="3–20 characters, letters/numbers/underscore"
                      autoComplete="username"
                    />
                    {checkingUsername && (
                      <span className="absolute right-3 top-3.5 text-muted-foreground text-xs">Checking...</span>
                    )}
                    {usernameAvailable === true && !checkingUsername && (
                      <span className="absolute right-3 top-3.5 text-green-500 text-xs">✓ Available</span>
                    )}
                    {usernameAvailable === false && !checkingUsername && (
                      <span className="absolute right-3 top-3.5 text-red-500 text-xs">✗ Taken</span>
                    )}
                  </div>
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pr-12 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                        errors.password ? 'border-red-500/50' : 'border-border focus:border-primary'
                      }`}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength.level >= level
                                ? level === 1
                                  ? 'bg-red-500'
                                  : level === 2
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          passwordStrength.level === 1
                            ? 'text-red-500'
                            : passwordStrength.level === 2
                            ? 'text-amber-500'
                            : 'text-green-500'
                        }`}
                      >
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pr-12 bg-muted/50 border rounded-lg focus:outline-none transition-colors text-foreground ${
                        errors.confirmPassword ? 'border-red-500/50' : 'border-border focus:border-primary'
                      }`}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 px-5 py-3 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={usernameAvailable === false}
                    className="flex-1 py-3 brand-gradient text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Teams + Confirm ── */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Favourite Sports & Teams */}
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Favourite Sports & Teams{' '}
                    <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                  </p>

                  {/* Loading skeleton */}
                  {loadingSports && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-8 w-16 bg-muted rounded-full animate-pulse" />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-7 w-24 bg-muted rounded-full animate-pulse" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {sportsFetchError && !loadingSports && (
                    <p className="text-xs text-muted-foreground">
                      Couldn&apos;t load sports right now — you can add your favourite teams later in your profile.
                    </p>
                  )}

                  {/* Empty state */}
                  {!loadingSports && !sportsFetchError && sportsData.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No sports available yet — check back soon!
                    </p>
                  )}

                  {/* Sport pills */}
                  {!loadingSports && sportsData.length > 0 && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {sportsData.map((entry) => {
                          const isActive = activeSport === entry.sport
                          const hasSelection = isSportSelected(entry.sport)
                          return (
                            <button
                              key={entry.sport}
                              type="button"
                              onClick={() => setActiveSport(isActive ? null : entry.sport)}
                              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                                isActive
                                  ? 'border-2 border-primary bg-primary/10 text-primary'
                                  : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                              }`}
                            >
                              {hasSelection && !isActive && (
                                <span className="mr-1 text-xs">✓</span>
                              )}
                              {entry.sport}
                            </button>
                          )
                        })}
                      </div>

                      {/* Team grid for active sport */}
                      {activeSport && activeEntry && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                          {activeEntry.hasTeams ? (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-muted-foreground font-medium">
                                  Select your {activeSport} teams
                                </p>
                                <button
                                  type="button"
                                  onClick={() => toggleTeam(activeSport, 'Any')}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
                                    isTeamSelected(activeSport, 'Any')
                                      ? 'bg-primary/15 border-primary text-primary'
                                      : 'border-border text-muted-foreground hover:border-primary/50'
                                  }`}
                                >
                                  {isTeamSelected(activeSport, 'Any') ? '✓ Following' : '+ Follow'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {activeEntry.teams.map((team) => {
                                  const selected = isTeamSelected(activeSport, team)
                                  return (
                                    <button
                                      key={team}
                                      type="button"
                                      onClick={() => toggleTeam(activeSport, team)}
                                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                                        selected
                                          ? 'bg-primary/15 border-primary text-primary'
                                          : 'bg-background border-border text-foreground hover:border-primary/50'
                                      }`}
                                    >
                                      {selected && <span className="mr-1">✓</span>}
                                      {team}
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                Follow all {activeSport} events
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleTeam(activeSport, 'Any')}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                                  isTeamSelected(activeSport, 'Any')
                                    ? 'bg-primary/15 border-primary text-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/50'
                                }`}
                              >
                                {isTeamSelected(activeSport, 'Any') ? '✓ Following' : '+ Follow'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selected chips */}
                      {formData.favoriteTeams.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {formData.favoriteTeams.map((fav) => (
                            <div
                              key={`${fav.sport}-${fav.team}`}
                              className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs font-medium"
                            >
                              <span className="text-muted-foreground">{fav.sport}</span>
                              {fav.team !== 'Any' && (
                                <>
                                  <span className="text-muted-foreground/50">·</span>
                                  <span>{fav.team}</span>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleTeam(fav.sport, fav.team)}
                                className="text-primary hover:opacity-70 ml-0.5"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Age verification */}
                <div
                  className={`p-4 rounded-lg border ${
                    errors.ageVerified ? 'border-red-500/50 bg-red-500/5' : 'border-border bg-muted/30'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ageVerified"
                      checked={formData.ageVerified}
                      onChange={handleInputChange}
                      className="mt-0.5 rounded border-border"
                    />
                    <span className="text-sm">
                      I confirm that I am <strong>18 years of age or over</strong>
                    </span>
                  </label>
                  {errors.ageVerified && <p className="text-red-500 text-xs mt-2">{errors.ageVerified}</p>}
                </div>

                {/* Terms & Conditions
                <div
                  className={`p-4 rounded-lg border ${
                    errors.termsAccepted ? 'border-red-500/50 bg-red-500/5' : 'border-border bg-muted/30'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      className="mt-0.5 rounded border-border"
                    />
                    <span className="text-sm">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" className="text-primary font-semibold hover:underline">
                        Terms & Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" className="text-primary font-semibold hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {errors.termsAccepted && <p className="text-red-500 text-xs mt-2">{errors.termsAccepted}</p>}
                </div>
                */}

                <p className="text-center text-sm text-muted-foreground">
                  You&apos;re nearly there — time to tip some winners!
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 px-5 py-3 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 brand-gradient text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating account...' : "Let's Tip! →"}
                  </button>
                </div>
              </div>
            )}
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
