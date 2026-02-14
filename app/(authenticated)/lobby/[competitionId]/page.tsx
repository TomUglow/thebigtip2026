'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft, Search, CheckCircle2, Target, Users, Trophy, Filter,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { Event, Competition, LeaderboardEntry } from '@/lib/types'

export default function CompetitionDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const competitionId = params.competitionId as string

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [userPicks, setUserPicks] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeTab, setActiveTab] = useState<'tips' | 'leaderboard'>('tips')
  const [sportFilter, setSportFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && competitionId) {
      fetchData()
    }
  }, [session, competitionId])

  const fetchData = async () => {
    try {
      const [compRes, eventsRes, picksRes, lbRes] = await Promise.all([
        fetch(`/api/competitions/${competitionId}`),
        fetch(`/api/events?competitionId=${competitionId}`),
        fetch('/api/picks'),
        fetch(`/api/leaderboard?competitionId=${competitionId}`),
      ])

      const [compData, eventsData, picksData, lbData] = await Promise.all([
        compRes.json(),
        eventsRes.json(),
        picksRes.json(),
        lbRes.json(),
      ])

      if (!compRes.ok) {
        console.error('Competition not found')
        return
      }

      setCompetition(compData)
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setUserPicks(Array.isArray(picksData) ? picksData : [])
      setLeaderboard(Array.isArray(lbData) ? lbData : [])
    } catch (error) {
      console.error('Error fetching competition data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePickTeam = async (eventId: string, selectedTeam: string) => {
    if (!selectedTeam) return
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, selectedTeam }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error saving pick:', error)
    }
  }

  const getUserPick = (eventId: string) => {
    const pick = userPicks.find((p) => p.eventId === eventId)
    return pick?.selectedTeam
  }

  // Build sport filter tabs dynamically from events
  const uniqueSports = ['All', ...Array.from(new Set(events.map((e) => e.sport))).sort()]

  // Filter events
  const filteredEvents = events
    .filter((e) => sportFilter === 'All' || e.sport === sportFilter)
    .filter((e) => !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()))

  // Progress
  const eventIds = new Set(events.map((e) => e.id))
  const pickedCount = userPicks.filter((p) => eventIds.has(p.eventId)).length
  const totalEvents = events.length
  const progressPercent = totalEvents > 0 ? (pickedCount / totalEvents) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
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
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Back link */}
      <Link href="/lobby" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Lobby
      </Link>

      {/* Competition header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight font-display">{competition.name}</h1>
        {competition.description && (
          <p className="text-sm text-muted-foreground mt-1">{competition.description}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: '#4CAF50' }} />
          <span className="text-sm font-semibold">
            <span className="gold-accent">{pickedCount}</span>/{totalEvents} tips submitted
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="brand-gradient h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Tabs: Place Tips | Leaderboard */}
      <div className="flex gap-1 bg-muted/50 border border-border p-1 rounded-lg w-fit">
        {(['tips', 'leaderboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md font-semibold text-sm transition-all ${
              activeTab === tab
                ? 'brand-gradient text-white shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab === 'tips' ? 'Place Tips' : 'Leaderboard'}
          </button>
        ))}
      </div>

      {/* Place Tips Tab */}
      {activeTab === 'tips' && (
        <div className="space-y-4">
          {/* Sport filter tabs */}
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

          {/* Search bar */}
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
                const userPick = getUserPick(event.id)
                const sportColor = SPORT_COLORS[event.sport] || '#D32F2F'
                const isLast = idx === filteredEvents.length - 1

                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-border' : ''}`}
                  >
                    {/* Sport badge */}
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0 min-w-[80px] text-center"
                      style={{ backgroundColor: `${sportColor}20`, color: sportColor }}
                    >
                      {event.sport}
                    </span>

                    {/* Event title */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{event.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(event.eventDate), 'd MMM yyyy')}
                      </div>
                    </div>

                    {/* Inline dropdown */}
                    {event.options && event.options.length > 0 ? (
                      <select
                        value={userPick || ''}
                        onChange={(e) => handlePickTeam(event.id, e.target.value)}
                        className={`w-48 p-2 rounded-lg border text-sm font-semibold appearance-none cursor-pointer transition-all focus:outline-none focus:border-primary flex-shrink-0 ${
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
                    ) : (
                      <span className="text-xs text-muted-foreground flex-shrink-0">No options</span>
                    )}

                    {/* Check indicator */}
                    {userPick && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  No events found{searchQuery && ` matching "${searchQuery}"`}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div>
          {leaderboard.length > 0 ? (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <div className="w-10 text-center">#</div>
                <div className="flex-1">Tipster</div>
                <div className="w-20 text-center">Score</div>
              </div>
              {leaderboard.map((entry) => {
                const isCurrentUser = (session?.user as any)?.id === entry.user.id
                return (
                  <div
                    key={entry.user.id}
                    className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                      isCurrentUser ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="w-10 text-center">
                      {entry.rank <= 3 ? (
                        <span className={`text-sm font-black ${entry.rank === 1 ? 'gold-accent' : 'text-muted-foreground'}`}>
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">{entry.rank}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 brand-gradient rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {entry.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className={`text-sm truncate ${isCurrentUser ? 'font-bold' : 'font-medium'}`}>
                        {entry.user.name || entry.user.email}
                        {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                      </span>
                    </div>
                    <div className="w-20 text-center">
                      <span className="text-sm font-bold tabular-nums">{entry.score}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No leaderboard data yet.</p>
              <p className="text-xs mt-1">Results will appear once scoring begins.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
