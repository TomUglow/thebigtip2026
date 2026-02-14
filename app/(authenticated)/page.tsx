'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format, differenceInHours, differenceInMinutes, differenceInDays } from 'date-fns'
import {
  Trophy, Target, TrendingUp, Calendar, CheckCircle2,
  Circle, Users
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ScoreGame, Event } from '@/lib/types'

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

interface LeaderboardEntry {
  rank: number
  user: { id: string; name: string | null; email: string }
  score: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [activeFilter, setActiveFilter] = useState('all')
  const [events, setEvents] = useState<Event[]>([])
  const [scores, setScores] = useState<ScoreGame[]>([])
  const [userPicks, setUserPicks] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
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
          )
        ]);
      };

      const [eventsRes, scoresRes, picksRes, compsRes] = await Promise.all([
        fetchWithTimeout('/api/events').catch(() => ({ json: async () => [] })),
        fetchWithTimeout('/api/scores').catch(() => ({ json: async () => [] })),
        fetchWithTimeout('/api/picks').catch(() => ({ json: async () => [] })),
        fetchWithTimeout('/api/competitions').catch(() => ({ json: async () => [] })),
      ])

      const [eventsData, scoresData, picksData, compsData] = await Promise.all([
        eventsRes.json(),
        scoresRes.json(),
        picksRes.json(),
        compsRes.json(),
      ])

      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setScores(Array.isArray(scoresData) ? scoresData : [])
      setUserPicks(Array.isArray(picksData) ? picksData : [])

      // Fetch leaderboard for the first active public competition
      const comps = Array.isArray(compsData) ? compsData : []
      const activeComp = comps.find((c: any) => c.isPublic && c.status === 'active') || comps[0]
      if (activeComp) {
        try {
          const lbRes = await fetchWithTimeout(`/api/leaderboard?competitionId=${activeComp.id}`)
          const lbData = await lbRes.json()
          setLeaderboard(Array.isArray(lbData) ? lbData : [])
        } catch {
          // Leaderboard is non-critical
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePickTeam = async (eventId: string, selectedTeam: string) => {
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, selectedTeam })
      })

      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error saving pick:', error)
    }
  }

  const getUserPick = (eventId: string) => {
    const pick = userPicks.find(p => p.eventId === eventId)
    return pick?.selectedTeam
  }

  const filteredEvents = events.filter(event => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'live') return event.status === 'live'
    if (activeFilter === 'upcoming') return event.status === 'upcoming'
    if (activeFilter === 'my-picks') return getUserPick(event.id) !== undefined
    return true
  })

  const upcomingGames = scores.filter(g => !g.completed)
  const recentResults = scores.filter(g => g.completed && g.scores)
  const userPicksCount = userPicks.length
  const correctPicks = userPicks.filter(p => p.isCorrect).length

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
          <h1 className="text-4xl font-black tracking-tight mb-2 text-white font-display">
            G&apos;day, <span className="gold-accent">{session?.user?.name?.split(' ')[0] || 'Tipster'}</span>
          </h1>
          <p className="text-white/70 text-lg mb-8">Here&apos;s what&apos;s happening.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Your Picks', value: `${userPicksCount}/50`, icon: Target },
              { label: 'Correct', value: correctPicks, icon: CheckCircle2 },
              { label: 'Win Rate', value: userPicksCount > 0 ? `${Math.round((correctPicks / userPicksCount) * 100)}%` : '--', icon: TrendingUp },
              { label: 'Rank', value: '--', icon: Trophy },
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

        {/* Live & Upcoming Games */}
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

        {/* Event Picks */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 gold-accent" />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">Make Your Picks</h2>
            </div>
            <div className="flex gap-1 bg-muted/50 border border-border p-1 rounded-lg">
              {['all', 'live', 'upcoming', 'my-picks'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    activeFilter === filter
                      ? 'brand-gradient text-white shadow-sm'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {filter === 'all' && 'All'}
                  {filter === 'live' && 'Live'}
                  {filter === 'upcoming' && 'Upcoming'}
                  {filter === 'my-picks' && 'My Picks'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => {
              const userPick = getUserPick(event.id)
              const sportColor = SPORT_COLORS[event.sport] || '#D32F2F'
              const eventDate = new Date(event.eventDate)
              const isUpcoming = event.status === 'upcoming'

              return (
                <div key={event.id} className="glass-card rounded-xl p-4 hover-elevate space-y-3">
                  <div className="flex justify-between items-start">
                    <span
                      className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide"
                      style={{ backgroundColor: `${sportColor}20`, color: sportColor }}
                    >
                      {event.sport}
                    </span>
                    <span className="text-muted-foreground text-xs font-semibold">
                      {isUpcoming ? formatCountdown(eventDate) : format(eventDate, 'MMM d')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handlePickTeam(event.id, 'team1')}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        userPick === 'team1'
                          ? 'bg-primary/15 border-primary'
                          : 'bg-muted/30 border-border hover:border-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-xs font-bold">
                          {event.team1Abbr}
                        </div>
                        <span className="font-semibold text-sm">{event.team1Name}</span>
                      </div>
                      <span className="gold-accent font-bold text-sm">{event.team1Odds || 'TBD'}</span>
                    </button>

                    <button
                      onClick={() => handlePickTeam(event.id, 'team2')}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        userPick === 'team2'
                          ? 'bg-primary/15 border-primary'
                          : 'bg-muted/30 border-border hover:border-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-xs font-bold">
                          {event.team2Abbr}
                        </div>
                        <span className="font-semibold text-sm">{event.team2Name}</span>
                      </div>
                      <span className="gold-accent font-bold text-sm">{event.team2Odds || 'TBD'}</span>
                    </button>
                  </div>

                  {userPick ? (
                    <div className="p-3 rounded-lg font-semibold text-sm text-center bg-green-500/15 border border-green-500/40 text-green-500">
                      Pick Locked: {userPick === 'team1' ? event.team1Abbr : event.team2Abbr}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg font-semibold text-sm text-center bg-yellow-500/15 border border-yellow-500/40">
                      <span className="gold-accent">Make Your Pick</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
              <p className="text-sm">No events found for this filter.</p>
              <p className="text-xs mt-2">Check back later for upcoming events!</p>
            </div>
          )}
        </section>

                {/* Leaderboard */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 gold-accent" />
            <h2 className="text-lg font-bold uppercase tracking-wider font-display">Leaderboard</h2>
          </div>
          {leaderboard.length > 0 ? (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <div className="w-10 text-center">#</div>
                <div className="flex-1">Tipster</div>
                <div className="w-20 text-center">Score</div>
              </div>
              {leaderboard.slice(0, 10).map((entry) => {
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
            <div className="text-center py-8 text-muted-foreground glass-card rounded-xl">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No leaderboard data yet.</p>
              <p className="text-xs mt-1">Join a competition to see rankings!</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
