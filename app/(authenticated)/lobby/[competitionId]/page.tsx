'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft, CheckCircle2, Target, Trophy, Filter, Copy, X,
  Shield, ClipboardCopy, MoreVertical, Trash2, Lock,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { Event, Competition, LeaderboardEntry } from '@/lib/types'
import CompetitionChat from '@/components/chat/CompetitionChat'

interface UserPick {
  id: string
  eventId: string
  competitionId: string
  selectedTeam: string
  isCorrect: boolean | null
  points: number
}

interface OtherCompetition {
  id: string
  name: string
}

export default function CompetitionDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const competitionId = params.competitionId as string
  const currentUserId = (session?.user as any)?.id as string | undefined

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [userPicks, setUserPicks] = useState<UserPick[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [sportFilter, setSportFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [codeCopied, setCodeCopied] = useState(false)
  const [currentUserIsCommissioner, setCurrentUserIsCommissioner] = useState(false)

  // Pre-fill state
  const [otherCompetitions, setOtherCompetitions] = useState<OtherCompetition[]>([])
  const [showPrefillModal, setShowPrefillModal] = useState(false)
  const [selectedSourceComp, setSelectedSourceComp] = useState('')
  const [prefilling, setPrefilling] = useState(false)

  // Commissioner management state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [removingUser, setRemovingUser] = useState<{ id: string; name: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const otherCompsFetchedRef = useRef(false)

  useEffect(() => {
    if (session && competitionId) {
      fetchData()
    }
  }, [session, competitionId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/competitions/${competitionId}`)
      if (!res.ok) {
        console.error('Competition not found')
        return
      }
      const data = await res.json()

      setCompetition({
        id: data.id,
        name: data.name,
        description: data.description,
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublic: data.isPublic,
        maxEvents: data.maxEvents,
        status: data.status,
        participantCount: data.participantCount,
        eventCount: data.eventCount,
        isJoined: data.isJoined,
        ownerId: data.ownerId,
        owner: data.owner,
        inviteCode: data.inviteCode ?? null,
      })
      setCurrentUserIsCommissioner(!!data.currentUserIsCommissioner)
      setEvents(Array.isArray(data.events) ? data.events : [])
      setUserPicks(Array.isArray(data.userPicks) ? data.userPicks : [])
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : [])
    } catch (error) {
      console.error('Error fetching competition data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOtherCompetitions = async () => {
    try {
      const res = await fetch('/api/competitions')
      if (!res.ok) return
      const data = await res.json()
      const comps: OtherCompetition[] = (Array.isArray(data) ? data : data.competitions ?? [])
        .filter((c: any) => c.isJoined && c.id !== competitionId)
        .map((c: any) => ({ id: c.id, name: c.name }))
      setOtherCompetitions(comps)
    } catch (error) {
      console.error('Error fetching other competitions:', error)
    }
  }

  const handlePickTeam = async (eventId: string, selectedTeam: string) => {
    if (!selectedTeam || isLocked) return

    const previousPicks = [...userPicks]
    const existingIdx = userPicks.findIndex((p) => p.eventId === eventId)
    if (existingIdx >= 0) {
      setUserPicks((prev) =>
        prev.map((p) => (p.eventId === eventId ? { ...p, selectedTeam } : p))
      )
    } else {
      setUserPicks((prev) => [
        ...prev,
        { id: `temp-${eventId}`, eventId, competitionId, selectedTeam, isCorrect: null, points: 0 },
      ])
    }

    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, competitionId, selectedTeam }),
      })
      if (!res.ok) {
        setUserPicks(previousPicks)
      } else {
        const savedPick = await res.json()
        setUserPicks((prev) =>
          prev.map((p) =>
            p.eventId === eventId
              ? { ...p, id: savedPick.id, selectedTeam: savedPick.selectedTeam }
              : p
          )
        )
      }
    } catch (error) {
      console.error('Error saving pick:', error)
      setUserPicks(previousPicks)
    }
  }

  const handlePrefill = async () => {
    if (!selectedSourceComp) return
    setPrefilling(true)
    try {
      const res = await fetch(`/api/picks?competitionId=${selectedSourceComp}`)
      if (!res.ok) return
      const sourcePicks: UserPick[] = await res.json()
      const currentEventIds = new Set(events.map((e) => e.id))
      const matchingPicks = sourcePicks.filter((p) => currentEventIds.has(p.eventId))
      for (const pick of matchingPicks) {
        if (userPicks.find((p) => p.eventId === pick.eventId)) continue
        await handlePickTeam(pick.eventId, pick.selectedTeam)
      }
    } catch (error) {
      console.error('Error pre-filling picks:', error)
    } finally {
      setPrefilling(false)
      setShowPrefillModal(false)
      setSelectedSourceComp('')
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    setOpenDropdown(null)
    setActionLoading(true)
    const newRole = currentRole === 'commissioner' ? 'member' : 'commissioner'
    try {
      const res = await fetch(`/api/competitions/${competitionId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setLeaderboard((prev) =>
          prev.map((e) => (e.user.id === userId ? { ...e, role: newRole } : e))
        )
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update role')
      }
    } catch {
      console.error('Error toggling role')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveUser = async () => {
    if (!removingUser) return
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/members/${removingUser.id}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setLeaderboard((prev) => prev.filter((e) => e.user.id !== removingUser.id))
        setRemovingUser(null)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to remove member')
      }
    } catch {
      console.error('Error removing member')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCompetition = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/competitions/${competitionId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/lobby')
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to delete competition')
        setShowDeleteConfirm(false)
      }
    } catch {
      console.error('Error deleting competition')
    } finally {
      setActionLoading(false)
    }
  }

  // Tips are locked once the tips-close date passes or the competition is completed
  const isLocked = competition
    ? new Date(competition.startDate) <= new Date() || competition.status === 'completed'
    : false

  const uniqueSports = ['All', ...Array.from(new Set(events.map((e) => e.sport))).sort()]
  const filteredEvents = events
    .filter((e) => sportFilter === 'All' || e.sport === sportFilter)
    .filter((e) => !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()))

  const eventIds = new Set(events.map((e) => e.id))
  const pickedCount = userPicks.filter((p) => eventIds.has(p.eventId)).length
  const totalEvents = events.length
  const progressPercent = totalEvents > 0 ? (pickedCount / totalEvents) * 100 : 0

  const commissionerCount = leaderboard.filter((e) => e.role === 'commissioner').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link href="/lobby" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Lobby
        </Link>
        <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
          <p className="text-sm">Competition not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Back link */}
      <Link href="/lobby" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Lobby
      </Link>

      {/* Competition header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight font-display">{competition.name}</h1>
          {competition.description && (
            <p className="text-sm text-muted-foreground mt-1">{competition.description}</p>
          )}
        </div>
        {currentUserIsCommissioner && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500/10 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>

      {/* Commissioner invite code panel */}
      {competition.inviteCode && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30">
          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
              Invite Code
            </p>
            <p className="text-sm font-mono font-bold tracking-widest">{competition.inviteCode}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(competition.inviteCode!)
              setCodeCopied(true)
              setTimeout(() => setCodeCopied(false), 2000)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-muted transition-colors flex-shrink-0"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            {codeCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#4CAF50' }} />
            <span className="text-sm font-semibold">
              <span className="gold-accent">{pickedCount}</span>/{totalEvents} tips submitted
            </span>
          </div>
          {isLocked && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              Tips locked {format(new Date(competition.startDate), 'd MMM yyyy')}
            </span>
          )}
          {!isLocked && (
            <span className="text-xs text-muted-foreground">
              Tips close {format(new Date(competition.startDate), 'd MMM yyyy')}
            </span>
          )}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="brand-gradient h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main content — tips left, leaderboard right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Tips column ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Section heading */}
          <div className="flex items-center gap-2">
            {isLocked
              ? <Lock className="w-4 h-4 text-muted-foreground" />
              : <Target className="w-4 h-4 text-primary" />
            }
            <h2 className="text-lg font-bold uppercase tracking-wider">
              {isLocked ? 'View Tips' : 'Place Tips'}
            </h2>
          </div>

          {/* Pre-fill banner — only when tips are open */}
          {!isLocked && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <Copy className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Already tipped another competition?</span>
              </div>
              <button
                onClick={async () => {
                  if (!otherCompsFetchedRef.current) {
                    await fetchOtherCompetitions()
                    otherCompsFetchedRef.current = true
                  }
                  setShowPrefillModal(true)
                }}
                className="text-sm font-semibold text-primary hover:underline flex-shrink-0"
              >
                Pre-fill from existing
              </button>
            </div>
          )}

          {/* Sport filters */}
          <div className="flex gap-1.5 flex-wrap">
            {uniqueSports.map((sport) => {
              const sportColor = sport === 'All' ? '#D32F2F' : (SPORT_COLORS[sport] || '#D32F2F')
              const isActive = sportFilter === sport
              return (
                <button
                  key={sport}
                  onClick={() => setSportFilter(sport)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-foreground/70 hover:text-foreground bg-muted/50 border border-border'
                  }`}
                  style={isActive ? { backgroundColor: sportColor } : undefined}
                >
                  {sport}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Event list */}
          <div className="glass-card rounded-xl overflow-hidden">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, idx) => {
                const pickData = userPicks.find((p) => p.eventId === event.id)
                const userPick = pickData?.selectedTeam
                const isCorrect = pickData?.isCorrect ?? null
                const sportColor = SPORT_COLORS[event.sport] || '#D32F2F'
                const isLast = idx === filteredEvents.length - 1
                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-border' : ''}`}
                  >
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0 min-w-[70px] text-center"
                      style={{ backgroundColor: `${sportColor}20`, color: sportColor }}
                    >
                      {event.sport}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{event.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(event.eventDate), 'd MMM yyyy')}
                      </div>
                    </div>

                    {event.options && event.options.length > 0 ? (
                      isLocked ? (
                        // View-only pick display
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {userPick ? (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                              isCorrect === true
                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                : isCorrect === false
                                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                : 'bg-muted/50 border-border text-foreground'
                            }`}>
                              {userPick}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No pick</span>
                          )}
                          {isCorrect === true && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                          {isCorrect === false && <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        </div>
                      ) : (
                        // Interactive select
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            value={userPick || ''}
                            onChange={(e) => handlePickTeam(event.id, e.target.value)}
                            className={`w-44 p-2 rounded-lg border text-sm font-semibold appearance-none cursor-pointer transition-all focus:outline-none focus:border-primary ${
                              userPick
                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                : 'bg-muted/30 border-border hover:border-foreground/30'
                            }`}
                            style={{
                              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 8px center',
                            }}
                          >
                            <option value="">Select pick...</option>
                            {event.options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          {userPick && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground flex-shrink-0">No options</span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No events found{searchQuery && ` matching "${searchQuery}"`}.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Leaderboard column ── */}
        <div className="lg:col-span-2 lg:sticky lg:top-6 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
            <h2 className="text-lg font-bold uppercase tracking-wider">Leaderboard</h2>
          </div>

          {leaderboard.length > 0 ? (
            <div className="glass-card rounded-xl" ref={dropdownRef}>
              <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border rounded-t-xl overflow-hidden">
                <div className="w-8 text-center">#</div>
                <div className="flex-1">Tipster</div>
                <div className="w-14 text-center">Score</div>
                {currentUserIsCommissioner && <div className="w-8" />}
              </div>
              {leaderboard.map((entry) => {
                const isCurrentUser = currentUserId === entry.user.id
                const isEntryCommissioner = entry.role === 'commissioner'
                const canDemote = isEntryCommissioner && commissionerCount > 1
                const isDropdownOpen = openDropdown === entry.user.id
                return (
                  <div
                    key={entry.user.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                      isCurrentUser ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="w-8 text-center">
                      <span className={`text-sm font-black ${
                        entry.rank === 1 ? 'gold-accent' : 'text-muted-foreground'
                      }`}>
                        {entry.rank}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 brand-gradient rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                          {entry.user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm truncate ${isCurrentUser ? 'font-bold' : 'font-medium'}`}>
                            {entry.user.name || entry.user.email}
                            {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                          </div>
                          {isEntryCommissioner && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <Shield className="w-2.5 h-2.5 text-primary" />
                              <span className="text-[9px] font-bold text-primary uppercase tracking-wide">Commissioner</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-14 text-center">
                      <span className="text-sm font-bold tabular-nums">{entry.score}</span>
                    </div>

                    {/* Commissioner management menu — hidden on own row */}
                    {currentUserIsCommissioner && !isCurrentUser && (
                      <div className="relative w-8 flex justify-center">
                        <button
                          onClick={() => setOpenDropdown(isDropdownOpen ? null : entry.user.id)}
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          disabled={actionLoading}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {isDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-background border border-border rounded-lg shadow-lg py-1 text-sm">
                            <button
                              onClick={() => handleToggleRole(entry.user.id, entry.role)}
                              disabled={isEntryCommissioner && !canDemote}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Shield className="w-3.5 h-3.5 text-primary" />
                              {isEntryCommissioner ? 'Remove as Commissioner' : 'Make Commissioner'}
                            </button>
                            <div className="h-px bg-border my-1" />
                            <button
                              onClick={() => {
                                setOpenDropdown(null)
                                setRemovingUser({
                                  id: entry.user.id,
                                  name: entry.user.name || entry.user.email,
                                })
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 text-red-500 transition-colors text-left text-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              Remove from competition
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground glass-card rounded-xl">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No leaderboard data yet.</p>
              <p className="text-xs mt-1">Results will appear once scoring begins.</p>
            </div>
          )}
        </div>

      </div>{/* end grid */}

      {/* Pre-fill Modal */}
      {showPrefillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Pre-fill from existing competition</h2>
              <button
                onClick={() => { setShowPrefillModal(false); setSelectedSourceComp('') }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy your picks from another competition for any matching events. Existing picks will not be overwritten.
            </p>
            <select
              value={selectedSourceComp}
              onChange={(e) => setSelectedSourceComp(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a competition...</option>
              {otherCompetitions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowPrefillModal(false); setSelectedSourceComp('') }}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrefill}
                disabled={!selectedSourceComp || prefilling}
                className="flex-1 px-4 py-2 rounded-lg brand-gradient text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {prefilling ? 'Applying...' : 'Apply picks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove user confirmation modal */}
      {removingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold">Remove from competition?</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove <span className="font-semibold text-foreground">{removingUser.name}</span> from this competition?
              Their tips and results will be kept in case they are re-added.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setRemovingUser(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group chat — private competitions only */}
      {!competition.isPublic && currentUserId && (
        <CompetitionChat
          competitionId={competitionId}
          currentUserId={currentUserId}
          currentUserIsCommissioner={currentUserIsCommissioner}
        />
      )}

      {/* Delete competition confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold">Delete competition?</h2>
            <p className="text-sm text-muted-foreground">
              This will permanently delete <span className="font-semibold text-foreground">{competition.name}</span> and all associated data including picks and scores. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompetition}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
