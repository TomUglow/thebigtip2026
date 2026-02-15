'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInHours, differenceInMinutes, differenceInDays } from 'date-fns'
import {
  Trophy, Target, TrendingUp, Calendar, CheckCircle2, Circle, Users, Plus,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ScoreGame, Competition } from '@/lib/types'
import MainEventCard from '@/components/MainEventCard'

export const dynamic = 'force-dynamic'

function formatCountdown(eventDate: Date): string {
  const now = new Date()
  const days = differenceInDays(eventDate, now)
  const hours = differenceInHours(eventDate, now)
  const mins = differenceInMinutes(eventDate, now) % 60

  if (hours < 0) return 'Started'
  if (days >= 1) return format(eventDate, 'EEE d MMM, h:mm a')
  if (hours >= 1) return `${hours}h ${mins}m`
  return `${mins}m`
}

function GameCard({ game }: { game: ScoreGame }) {
  const commence = new Date(game.commenceTime)
  const isLive = game.scores && !game.completed
  const isCompleted = game.completed

  let timeLabel: string
  if (isLive) {
    timeLabel = 'LIVE'
  } else if (isCompleted) {
    timeLabel = 'FT'
  } else {
    timeLabel = formatCountdown(commence)
  }

  const sportColor = SPORT_COLORS[game.sport] || '#D32F2F'
  const homeScore = game.scores?.find((s) => s.name === game.homeTeam)?.score
  const awayScore = game.scores?.find((s) => s.name === game.awayTeam)?.score
  const hasScores = homeScore != null && awayScore != null

  return (
    <div className={`glass-card rounded-xl p-3 space-y-2 hover-elevate ${isCompleted ? 'opacity-80' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border"
          style={{ borderColor: sportColor, color: sportColor }}
        >
          {game.sport}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
            <Circle className="w-2 h-2 fill-red-500 animate-pulse" />
            LIVE
          </span>
        ) : isCompleted ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <CheckCircle2 className="w-3 h-3" />
            FT
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium">{timeLabel}</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="truncate">{game.homeTeam}</span>
          {hasScores && <span className="font-bold tabular-nums">{homeScore}</span>}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{game.awayTeam}</span>
          {hasScores && <span className="font-bold tabular-nums">{awayScore}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [scores, setScores] = useState<ScoreGame[]>([])
  const [userPicks, setUserPicks] = useState<any[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      const fetchWithTimeout = (url: string, timeout = 5000) => {
        return Promise.race([
          fetch(url),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ])
      }

      const [dashboardRes, scoresRes] = await Promise.all([
        fetchWithTimeout('/api/dashboard').catch(() => ({ ok: false, json: async () => ({}) })),
        fetchWithTimeout('/api/scores').catch(() => ({ json: async () => [] })),
      ])

      const [dashboardData, scoresData] = await Promise.all([
        dashboardRes.json(),
        scoresRes.json(),
      ])

      setScores(Array.isArray(scoresData) ? scoresData : [])

      if ((dashboardRes as Response).ok !== false) {
        setCompetitions(Array.isArray(dashboardData.competitions) ? dashboardData.competitions : [])
        setUserPicks(Array.isArray(dashboardData.userPicks) ? dashboardData.userPicks : [])
        setUserRank(dashboardData.userRank ?? null)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinedComps = competitions.filter((c) => c.isJoined)
  const userPicksCount = userPicks.length
  const correctPicks = userPicks.filter((p) => p.isCorrect).length
  const upcomingGames = scores.filter((g) => !g.completed)
  const recentResults = scores.filter((g) => g.completed && g.scores)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <div className="border-b border-white/10 py-12 px-6 relative">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-charcoal font-display">
                G&apos;day, <span className="text-primary">{session?.user?.name?.split(' ')[0] || 'Tipster'}</span>
              </h1>
              <p className="text-foreground text-lg">Here&apos;s what&apos;s happening.</p>
            </div>
            <Link
              href="/lobby/create"
              className="glass-button px-5 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center gap-2 hover-elevate hover:bg-card/50 hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Private League
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'MY COMPS', value: joinedComps.length, icon: Trophy },
              { label: 'MAIN TIPS', value: `${userPicksCount}/50`, icon: Target },
              { label: 'WIN RATE', value: userPicksCount > 0 ? `${Math.round((correctPicks / userPicksCount) * 100)}%` : '--', icon: TrendingUp },
              { label: 'GLOBAL RANK', value: userRank || '--', icon: Users },
            ].map((stat, i) => (
              <div key={i} className="bg-card backdrop-blur-sm border border-white/10 rounded-xl p-4 hover-elevate cursor-default">
                <stat.icon className="w-7 h-7 mb-2 gold-accent" />
                <div className="text-xl font-black text.light-primary mb-1 font-display">{stat.value}</div>
                <div className="text-sm font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      <MainEventCard competitions={competitions} />

        {/* Upcoming Games */}
        {upcomingGames.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 gold-accent" />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">Upcoming Games</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingGames.slice(0, 6).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#4CAF50' }} />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">Recent Results</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentResults.slice(0, 6).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
