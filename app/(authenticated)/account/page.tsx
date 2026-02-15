'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, Save, X, Upload, ChevronDown } from 'lucide-react'
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
    }
  }, [session])

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
        <div className="glass-card rounded-xl p-6 max-w-2xl">
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
