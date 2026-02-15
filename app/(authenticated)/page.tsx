'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format, differenceInHours, differenceInMinutes, differenceInDays } from 'date-fns'
import {
  Trophy, Target, TrendingUp, Calendar, CheckCircle2,
  Circle, Users, Plus, Clock,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ScoreGame, Competition } from '@/lib/types'

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

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  const units = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HRS' },
    { value: timeLeft.minutes, label: 'MIN' },
    { value: timeLeft.seconds, label: 'SEC' },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <div className="bg-primary/90 text-white text-lg font-black w-12 h-12 rounded-lg flex items-center justify-center tabular-nums font-display">
              {String(unit.value).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-muted-foreground font-bold mt-1">{unit.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-xl font-black text-muted-foreground mb-4">:</span>
          )}
        </div>
      ))}
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
  const [joining, setJoining] = useState(false)

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

  const handleEnterNow = async (competitionId: string) => {
    setJoining(true)
    try {
      const res = await fetch('/api/competitions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId }),
      })
      if (res.ok) {
        router.push(`/lobby/${competitionId}`)
      }
    } catch (error) {
      console.error('Error joining competition:', error)
    } finally {
      setJoining(false)
    }
  }

  const mainCompetition = competitions.find(
    (c) => c.isPublic && (c.status === 'active' || c.status === 'upcoming')
  ) || competitions.find((c) => c.isPublic)

  const joinedComps = competitions.filter((c) => c.isJoined)
  const userPicksCount = userPicks.length
  const correctPicks = userPicks.filter((p) => p.isCorrect).length
  const upcomingGames = scores.filter((g) => !g.completed)
  const recentResults = scores.filter((g) => g.completed && g.scores)

  // Smart button state for main competition
  const getMainButtonState = (comp: Competition) => {
    if (!comp.isJoined) return 'enter'
    if (comp.status === 'upcoming' || comp.status === 'active') return 'edit'
    return 'leaderboard'
  }

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
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-white font-display">
                G&apos;day, <span className="gold-accent">{session?.user?.name?.split(' ')[0] || 'Tipster'}</span>
              </h1>
              <p className="text-white/70 text-lg">Here&apos;s what&apos;s happening.</p>
            </div>
            <button
              disabled
              className="glass-card px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed"
              title="Coming Soon"
            >
              <Plus className="w-4 h-4" />
              Create Private League
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'MY COMPS', value: joinedComps.length, icon: Trophy },
              { label: 'MAIN TIPS', value: `${userPicksCount}/50`, icon: Target },
              { label: 'WIN RATE', value: userPicksCount > 0 ? `${Math.round((correctPicks / userPicksCount) * 100)}%` : '--', icon: TrendingUp },
              { label: 'GLOBAL RANK', value: userRank || '--', icon: Users },
            ].map((stat, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover-elevate cursor-default">
                <stat.icon className="w-5 h-5 mb-2 gold-accent" />
                <div className="text-3xl font-black text-white mb-1 font-display">{stat.value}</div>
                <div className="text-white/50 text-sm font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Main Event Card */}
        {mainCompetition && (
          <section>
            <div
              className="glass-card rounded-xl overflow-hidden border-2 p-6"
              style={{ borderColor: '#FFD700' }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded"
                      style={{ backgroundColor: '#FFD700', color: '#000' }}
                    >
                      Main Event
                    </span>
                    {mainCompetition.entryFee === 0 && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded border border-border text-muted-foreground font-semibold">
                        Free Entry
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black tracking-tight font-display">
                    {mainCompetition.name}
                  </h2>

                  {mainCompetition.description && (
                    <p className="text-sm text-muted-foreground max-w-lg">
                      {mainCompetition.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {mainCompetition.participantCount} tipsters
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" /> {mainCompetition.eventCount} events
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-2">
                      <Clock className="w-3 h-3" /> TIPS CLOSE IN
                    </div>
                    <CountdownTimer targetDate={mainCompetition.startDate} />
                  </div>

                  {(() => {
                    const state = getMainButtonState(mainCompetition)
                    if (state === 'enter') {
                      return (
                        <button
                          onClick={() => handleEnterNow(mainCompetition.id)}
                          disabled={joining}
                          className="brand-gradient text-white text-sm font-bold px-6 py-2.5 rounded-lg hover-elevate disabled:opacity-50"
                        >
                          {joining ? 'Entering...' : 'Enter Now'}
                        </button>
                      )
                    }
                    if (state === 'edit') {
                      return (
                        <button
                          onClick={() => router.push(`/lobby/${mainCompetition.id}`)}
                          className="brand-gradient text-white text-sm font-bold px-6 py-2.5 rounded-lg hover-elevate"
                        >
                          Edit Tips
                        </button>
                      )
                    }
                    return (
                      <button
                        onClick={() => router.push(`/lobby/${mainCompetition.id}`)}
                        className="glass-card text-sm font-bold px-6 py-2.5 rounded-lg hover-elevate"
                      >
                        View Leaderboard
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          </section>
        )}

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
