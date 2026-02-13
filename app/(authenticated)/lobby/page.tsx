'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search, Users, Trophy, ChevronRight,
  Lock, Globe, Target
} from 'lucide-react'

interface Competition {
  id: string
  name: string
  description: string | null
  entryFee: number
  prizePool: number
  startDate: string
  endDate: string
  isPublic: boolean
  maxEvents: number
  status: string
  participantCount: number
  eventCount: number
  owner: { id: string; name: string | null }
}

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
            <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {competition.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {competition.description || 'Tipping competition'}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-sm flex-shrink-0">
          <div className="flex items-center gap-1.5 text-muted-foreground w-20">
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono">{competition.participantCount}</span>
          </div>
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

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await fetch('/api/competitions')
        const data = await res.json()
        if (Array.isArray(data)) setCompetitions(data)
      } catch (error) {
        console.error('Error fetching competitions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
  }, [])

  const mainCompetition = competitions.find(
    (c) => c.isPublic && c.status === 'active'
  )

  const otherCompetitions = competitions.filter((c) => {
    if (mainCompetition && c.id === mainCompetition.id) return false
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
      <div>
        <h1 className="text-2xl font-black tracking-tight">Contest Lobby</h1>
        <p className="text-sm text-muted-foreground">
          Enter the main competition or create your own private league.
        </p>
      </div>

      {/* Main Competition Banner */}
      {mainCompetition && (
        <div
          className="glass-card rounded-xl overflow-hidden border-2 p-5"
          style={{ borderColor: '#FFD700' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#FFD700', color: '#000' }}
                >
                  Main Event
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground font-semibold">
                  Free Entry
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight">
                {mainCompetition.name}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                {mainCompetition.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {mainCompetition.participantCount} tipsters
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" /> {mainCompetition.eventCount} events
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="brand-gradient text-white text-sm font-bold px-5 py-2.5 rounded-lg hover-elevate">
                Enter Now
              </button>
              <Link
                href={`/lobby/${mainCompetition.id}`}
                className="glass-card text-sm font-semibold px-5 py-2.5 rounded-lg hover-elevate text-foreground"
              >
                View Events
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Join Private Code */}
      <div className="glass-card rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Private Code:</span>
            <input
              placeholder="Enter invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm font-mono flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            disabled={!joinCode}
            className="brand-gradient text-white text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover-elevate"
          >
            Join
          </button>
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
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Competitions ({otherCompetitions.length})
          </h2>
        </div>

        {/* Table Header (desktop) */}
        <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="flex-1">Competition</div>
          <div className="w-20 text-center">Entries</div>
          <div className="w-16 text-center">Type</div>
          <div className="w-20 text-center">Status</div>
          <div className="w-4" />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {otherCompetitions.length > 0 ? (
            otherCompetitions.map((comp) => (
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
