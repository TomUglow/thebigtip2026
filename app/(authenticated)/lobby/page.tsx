'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search, Users, Trophy, ChevronRight,
  Lock, Globe, Target, Plus,
} from 'lucide-react'
import type { Competition } from '@/lib/types'
import MainEventCard from '@/components/dashboard/MainEventCard'
import { clientCache } from '@/lib/client-cache'
import PublicEventRequestModal from '@/components/PublicEventRequestModal'

function CompetitionRow({ competition }: { competition: Competition }) {
  return (
    <Link href={`/lobby/${competition.id}`}>
      <div className="lobby-row hover-elevate cursor-pointer group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            {competition.isPublic ? (
              <Globe className="w-4 h-4 text-primary" />
            ) : (
              <Lock className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {competition.name}
              </span>
              {competition.isPublic && competition.status === 'active' && (
                <span
                  className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ backgroundColor: '#FFD700', color: '#000' }}
                >
                  Main
                </span>
              )}
              {competition.isJoined && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-green-500/40 text-green-500 font-semibold flex-shrink-0">
                  Joined
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {competition.description || 'Tipping competition'}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-sm flex-shrink-0">
          <div className="flex items-center gap-1.5 text-muted-foreground w-16">
            <Target className="w-3.5 h-3.5" />
            <span className="font-mono">{competition.eventCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground w-16">
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono">{competition.participantCount}</span>
          </div>
          {(competition.prizePool ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground w-18">
              <Trophy className="w-3.5 h-3.5" />
              <span className="font-mono">${competition.prizePool?.toFixed(0) ?? 0}</span>
            </div>
          )}
          <span
            className={`text-[10px] w-16 text-center px-2 py-0.5 rounded-full border font-semibold ${
              competition.isPublic
                ? 'bg-muted text-muted-foreground border-border'
                : 'border-border text-muted-foreground'
            }`}
          >
            {competition.isPublic ? 'Open' : 'Private'}
          </span>
          <span className="text-xs text-muted-foreground w-20 text-center capitalize">
            {competition.status}
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}

export default function LobbyPage() {
  const { data: session } = useSession()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joiningByCode, setJoiningByCode] = useState(false)
  const [joinCodeError, setJoinCodeError] = useState('')
  const [joinCodeSuccess, setJoinCodeSuccess] = useState('')
  const [showEventRequestModal, setShowEventRequestModal] = useState(false)

  useEffect(() => {
    const CACHE_KEY = 'competitions'
    const fetchCompetitions = async () => {
      try {
        const cached = clientCache.get<Competition[]>(CACHE_KEY)
        if (cached) {
          setCompetitions(cached)
          setLoading(false)
          return
        }
        const res = await fetch('/api/competitions')
        const data = await res.json()
        if (Array.isArray(data)) {
          clientCache.set(CACHE_KEY, data, 2 * 60 * 1000)
          setCompetitions(data)
        }
      } catch (error) {
        console.error('Error fetching competitions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
  }, [])

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return

    setJoiningByCode(true)
    setJoinCodeError('')
    setJoinCodeSuccess('')

    try {
      const res = await fetch('/api/competitions/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.toUpperCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setJoinCodeError(data.error || 'Failed to join competition')
        return
      }

      setJoinCodeSuccess('Successfully joined competition!')
      setJoinCode('')

      // Invalidate cache and refresh competitions list
      clientCache.invalidate('competitions')
      clientCache.invalidate('dashboard')
      const compsRes = await fetch('/api/competitions')
      const compsData = await compsRes.json()
      if (Array.isArray(compsData)) {
        clientCache.set('competitions', compsData, 2 * 60 * 1000)
        setCompetitions(compsData)
      }
    } catch (error) {
      console.error('Error joining by code:', error)
      setJoinCodeError('An error occurred. Please try again.')
    } finally {
      setJoiningByCode(false)
    }
  }

  const filteredCompetitions = competitions.filter((c) => {
    if (search) return c.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight font-display">Competitions</h1>
          <p className="text-sm text-muted-foreground">
            Your competitions and ones you can join.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEventRequestModal(true)}
            className="glass-card px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover-elevate hover:border-primary/50 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Request Event
          </button>
          <Link
            href="/lobby/create"
            className="glass-card px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover-elevate hover:border-primary/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create League
          </Link>
        </div>
      </div>

      <PublicEventRequestModal
        isOpen={showEventRequestModal}
        onClose={() => setShowEventRequestModal(false)}
      />

      <MainEventCard competitions={competitions} />

      {/* Join Private Code */}
      <div className="glass-card rounded-xl p-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
              <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">Invite Code:</span>
              <input
                placeholder="Enter invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={joiningByCode}
                className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm font-mono flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleJoinByCode}
              disabled={!joinCode.trim() || joiningByCode}
              className="brand-gradient text-white text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover-elevate w-full sm:w-auto"
            >
              {joiningByCode ? 'Joining...' : 'Join'}
            </button>
          </div>

          {/* Error message */}
          {joinCodeError && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {joinCodeError}
            </div>
          )}

          {/* Success message */}
          {joinCodeSuccess && (
            <div className="text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              {joinCodeSuccess}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search competitions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Competitions List */}
      <section>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
          <h2 className="text-sm font-bold uppercase tracking-wider font-display">
            Competitions ({filteredCompetitions.length})
          </h2>
        </div>

        {/* Table Header (desktop) */}
        <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="flex-1">Competition</div>
          <div className="w-16 text-center">Events</div>
          <div className="w-16 text-center">Entries</div>
          <div className="w-16 text-center">Type</div>
          <div className="w-20 text-center">Status</div>
          <div className="w-4" />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {filteredCompetitions.length > 0 ? (
            filteredCompetitions.map((comp) => (
              <CompetitionRow key={comp.id} competition={comp} />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No competitions found{search && ` matching "${search}"`}. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
