'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, Save, X, Upload, ChevronDown, ShieldCheck, ShieldOff } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  username: string
  email: string
  name: string | null
  mobile: string | null
  postcode: string | null
  avatar: string | null
}

interface FavoriteTeam {
  id: string
  sport: string
  team: string
}

const SPORTS_DATA: Record<string, string[]> = {
  'NFL': ['Kansas City Chiefs', 'San Francisco 49ers', 'Buffalo Bills', 'Dallas Cowboys'],
  'NBA': ['Boston Celtics', 'Los Angeles Lakers', 'Denver Nuggets', 'Golden State Warriors'],
  'EPL': ['Manchester City', 'Liverpool', 'Arsenal', 'Manchester United'],
  'AFL': ['Melbourne Demons', 'Geelong Cats', 'Brisbane Lions', 'Richmond Tigers'],
  'NRL': ['Penrith Panthers', 'Melbourne Storm', 'Parramatta Eels', 'Sydney Roosters'],
}

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set())

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaStep, setMfaStep] = useState<'idle' | 'setup' | 'disable'>('idle')
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaPassword, setMfaPassword] = useState('')

  const updateEditValue = (field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }))
  }

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/account/profile')
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setEditValues({
            username: data.username,
            email: data.email,
            name: data.name || '',
            mobile: data.mobile || '',
            postcode: data.postcode || '',
          })
        } else {
          const errorData = await res.json()
          console.error('Profile fetch error:', errorData)
          setMessage({ type: 'error', text: errorData.error || 'Failed to load profile' })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setMessage({ type: 'error', text: 'Failed to load profile' })
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchProfile()
      fetchMfaStatus()
    }
  }, [session])

  const fetchMfaStatus = async () => {
    try {
      const res = await fetch('/api/account/mfa')
      if (res.ok) {
        const data = await res.json()
        setMfaEnabled(data.mfaEnabled)
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error)
    }
  }

  const handleMfaSetup = async () => {
    setMfaLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/account/mfa/setup', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setMfaQrCode(data.qrCode)
        setMfaSecret(data.secret)
        setMfaStep('setup')
        setMfaCode('')
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to start MFA setup' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setMfaLoading(false)
    }
  }

  const handleMfaEnable = async () => {
    setMfaLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/account/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totp: mfaCode }),
      })
      if (res.ok) {
        setMfaEnabled(true)
        setMfaStep('idle')
        setMfaQrCode('')
        setMfaSecret('')
        setMfaCode('')
        setMessage({ type: 'success', text: 'Two-factor authentication enabled' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to enable MFA' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setMfaLoading(false)
    }
  }

  const handleMfaDisable = async () => {
    setMfaLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/account/mfa/disable', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: mfaPassword }),
      })
      if (res.ok) {
        setMfaEnabled(false)
        setMfaStep('idle')
        setMfaPassword('')
        setMessage({ type: 'success', text: 'Two-factor authentication disabled' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to disable MFA' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setMfaLoading(false)
    }
  }

  // Fetch favorite teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/account/teams')
        if (res.ok) {
          const data = await res.json()
          setFavoriteTeams(data.teams || [])
        }
      } catch (error) {
        console.error('Error fetching teams:', error)
      }
    }

    if (activeTab === 'sports') {
      fetchTeams()
    }
  }, [activeTab])

  const handleSaveField = async (field: string) => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: editValues[field] }),
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setEditingField(null)
        setMessage({ type: 'success', text: `${field} updated successfully` })

        // Update session if name was changed
        if (field === 'name') {
          await updateSession()
        }
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (passwordData.new.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        }),
      })

      if (res.ok) {
        setPasswordData({ current: '', new: '', confirm: '' })
        setMessage({ type: 'success', text: 'Password changed successfully' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
      } finally {
        setSaving(false)
      }
    }

  const handleAddTeam = async (sport: string, team: string) => {
    try {
      const res = await fetch('/api/account/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, team }),
      })

      if (res.ok) {
        const data = await res.json()
        setFavoriteTeams(data.teams || [])
        setMessage({ type: 'success', text: `${team} added to favorites` })
      } else {
        setMessage({ type: 'error', text: 'Failed to add team' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    }
  }

  const handleRemoveTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/account/teams/${teamId}`, { method: 'DELETE' })

      if (res.ok) {
        setFavoriteTeams((prev) => prev.filter((t) => t.id !== teamId))
        setMessage({ type: 'success', text: 'Team removed from favorites' })
      } else {
        setMessage({ type: 'error', text: 'Failed to remove team' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
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

  const isTeamSelected = (sport: string, team: string) => {
    return favoriteTeams.some((t) => t.sport === sport && t.team === team)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-foreground text-lg mb-4">Failed to load profile</p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and settings</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-500'
              : 'bg-red-500/10 border border-red-500/30 text-red-500'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-8 overflow-x-auto">
        {['profile', 'security', 'sports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab === 'profile' && 'Profile'}
            {tab === 'security' && 'Security'}
            {tab === 'sports' && 'Sports & Teams'}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold mb-4">Profile Picture</h3>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 brand-gradient rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {profile.name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <button className="glass-button px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Change photo
              </button>
            </div>
          </div>

          {/* Profile Fields */}
          {['username', 'email', 'name', 'mobile', 'postcode'].map((field) => (
            <div key={field} className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-muted-foreground mb-1 capitalize">
                    {field === 'postcode' ? 'Postcode' : field}
                  </label>
                  {editingField === field ? (
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={editValues[field]}
                      onChange={(e) => updateEditValue(field, e.target.value)}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-foreground font-medium">
                      {editValues[field] || 'Not set'}
                    </p>
                  )}
                </div>
                {editingField === field ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField(field)}
                      disabled={saving}
                      className="p-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingField(null)
                        setEditValues((prev) => ({
                          ...prev,
                          [field]: profile[field as keyof UserProfile] || '',
                        }))
                      }}
                      className="p-2 rounded-lg border border-border hover:bg-muted"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingField(field)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          {/* Change Password */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold mb-6">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, current: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, new: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Re-enter new password"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={saving || !passwordData.current || !passwordData.new}
                className="w-full py-3 brand-gradient text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              {mfaEnabled
                ? <ShieldCheck className="w-5 h-5 text-green-500" />
                : <ShieldOff className="w-5 h-5 text-muted-foreground" />
              }
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              {mfaEnabled && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/30">
                  Enabled
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {mfaEnabled
                ? 'Your account is protected with an authenticator app. You will need your app each time you sign in.'
                : 'Add an extra layer of security by requiring a code from your authenticator app at sign-in.'}
            </p>

            {/* Idle state */}
            {mfaStep === 'idle' && !mfaEnabled && (
              <button
                onClick={handleMfaSetup}
                disabled={mfaLoading}
                className="py-2.5 px-5 brand-gradient text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50"
              >
                {mfaLoading ? 'Loading...' : 'Enable 2FA'}
              </button>
            )}

            {mfaStep === 'idle' && mfaEnabled && (
              <button
                onClick={() => { setMfaStep('disable'); setMfaPassword('') }}
                className="py-2.5 px-5 border border-red-500/50 text-red-500 font-semibold rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Disable 2FA
              </button>
            )}

            {/* Setup flow — QR code */}
            {mfaStep === 'setup' && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold mb-2">1. Scan this QR code with your authenticator app</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Use Google Authenticator, Authy, or any TOTP-compatible app.
                  </p>
                  {mfaQrCode && (
                    <div className="inline-block p-3 bg-white rounded-xl">
                      <img src={mfaQrCode} alt="MFA QR code" className="w-44 h-44" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Can&apos;t scan? Enter this code manually:</p>
                  <code className="text-xs bg-muted px-3 py-2 rounded-lg block font-mono tracking-wider break-all">
                    {mfaSecret}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">2. Enter the 6-digit code from your app to confirm</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary tracking-widest text-center text-lg"
                    placeholder="000000"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleMfaEnable}
                    disabled={mfaLoading || mfaCode.length !== 6}
                    className="py-2.5 px-5 brand-gradient text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50"
                  >
                    {mfaLoading ? 'Verifying...' : 'Activate 2FA'}
                  </button>
                  <button
                    onClick={() => { setMfaStep('idle'); setMfaQrCode(''); setMfaSecret(''); setMfaCode('') }}
                    className="py-2.5 px-5 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Disable flow — password confirm */}
            {mfaStep === 'disable' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your password to confirm you want to disable 2FA.</p>
                <input
                  type="password"
                  value={mfaPassword}
                  onChange={(e) => setMfaPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Your password"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleMfaDisable}
                    disabled={mfaLoading || !mfaPassword}
                    className="py-2.5 px-5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {mfaLoading ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                  <button
                    onClick={() => { setMfaStep('idle'); setMfaPassword('') }}
                    className="py-2.5 px-5 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sports & Teams Tab */}
      {activeTab === 'sports' && (
        <div className="space-y-6">
          {/* Selected Teams */}
          {favoriteTeams.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Your Favorite Teams</h3>
              <div className="space-y-3">
                {favoriteTeams.reduce(
                  (acc, team) => {
                    const sport = acc.find((g) => g.sport === team.sport)
                    if (sport) {
                      sport.teams.push(team)
                    } else {
                      acc.push({ sport: team.sport, teams: [team] })
                    }
                    return acc
                  },
                  [] as Array<{ sport: string; teams: FavoriteTeam[] }>
                ).map((group) => (
                  <div key={group.sport}>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{group.sport}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.teams.map((team) => (
                        <div
                          key={team.id}
                          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs"
                        >
                          <span>{team.team}</span>
                          <button
                            onClick={() => handleRemoveTeam(team.id)}
                            className="text-primary hover:opacity-70"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Teams */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold mb-4">Add More Teams</h3>
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
                        <div key={team} className="flex items-center justify-between gap-2">
                          <span className="text-sm">{team}</span>
                          {isTeamSelected(sport, team) ? (
                            <button
                              onClick={() => {
                                const fav = favoriteTeams.find((t) => t.sport === sport && t.team === team)
                                if (fav) handleRemoveTeam(fav.id)
                              }}
                              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:opacity-70"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddTeam(sport, team)}
                              className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
