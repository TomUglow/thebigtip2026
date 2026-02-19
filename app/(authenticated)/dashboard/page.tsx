'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInHours, differenceInMinutes, differenceInDays } from 'date-fns'
import {
  Trophy, Target, TrendingUp, Calendar, CheckCircle2, Circle, Users, Plus, Lock, X,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import { clientCache } from '@/lib/client-cache'
import type { ScoreGame, Competition } from '@/lib/types'
import MainEventCard from '@/components/dashboard/MainEventCard'
import ProfileCompletionModal from '@/components/dashboard/ProfileCompletionModal'

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

interface GamePick {
  selectedTeam: string
  isCorrect: boolean | null
}

function GameCard({ game, pick }: { game: ScoreGame; pick?: GamePick | null }) {
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

  const pickCorrect = pick?.isCorrect === true
  const pickWrong = pick?.isCorrect === false
  const pickPending = pick && pick.isCorrect === null

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
      {pick && (
        <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border truncate ${
          pickCorrect
            ? 'bg-green-500/15 text-green-500 border-green-500/25'
            : pickWrong
            ? 'bg-red-500/15 text-red-500 border-red-500/25'
            : 'bg-primary/10 text-primary border-primary/20'
        }`}>
          {pickCorrect && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
          {pickWrong && <X className="w-3 h-3 flex-shrink-0" />}
          {(pickPending || (!isCompleted && pick)) && <Target className="w-3 h-3 flex-shrink-0" />}
          <span className="truncate">{pick.selectedTeam}</span>
        </div>
      )}
    </div>
  )
}

/** Loosely matches a pick's selectedTeam to a game's home/away team names.
 *  Handles minor naming differences (e.g. "Melbourne" vs "Melbourne Demons"). */
function findPickForGame(game: ScoreGame, picks: any[]): GamePick | null {
  for (const p of picks) {
    if (!p.selectedTeam) continue
    const picked = p.selectedTeam.toLowerCase()
    const home = game.homeTeam.toLowerCase()
    const away = game.awayTeam.toLowerCase()
    if (
      picked === home || picked === away ||
      home.includes(picked) || away.includes(picked) ||
      picked.includes(home) || picked.includes(away)
    ) {
      return { selectedTeam: p.selectedTeam, isCorrect: p.isCorrect ?? null }
    }
  }
  return null
}

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [scores, setScores] = useState<ScoreGame[]>([])
  const [userPicks, setUserPicks] = useState<any[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joiningByCode, setJoiningByCode] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)

  useEffect(() => {
    if (session) {
      // Check if user has completed profile
      checkProfileStatus()
      fetchData()
    }
  }, [session])

  const checkProfileStatus = async () => {
    try {
      const res = await fetch('/api/account/profile')
      if (res.ok) {
        const data = await res.json()
        if (!data.profileCompleted) {
          setProfileCompleted(false)
          setShowProfileModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking profile status:', error)
    }
  }

  const fetchData = async () => {
    const CACHE_KEY = 'dashboard'
    try {
      const fetchWithTimeout = (url: string, timeout = 5000) => {
        return Promise.race([
          fetch(url),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ])
      }

      // Serve cached dashboard data immediately while scores fetch in background
      const cached = clientCache.get<{ competitions: Competition[]; userPicks: any[]; userRank: number | null }>(CACHE_KEY)
      if (cached) {
        setCompetitions(cached.competitions)
        setUserPicks(cached.userPicks)
        setUserRank(cached.userRank)
      }

      const fetches: Promise<any>[] = [
        fetchWithTimeout('/api/scores').catch((err) => {
          console.error('Scores API failed:', err)
          return { json: async () => [] }
        }),
      ]
      if (!cached) {
        fetches.push(
          fetchWithTimeout('/api/dashboard').catch((err) => {
            console.error('Dashboard API failed:', err)
            return { ok: false, json: async () => ({}) }
          })
        )
      }

      const [scoresRes, dashboardRes] = await Promise.all(fetches)
      const scoresData = await scoresRes.json()
      setScores(Array.isArray(scoresData) ? scoresData : [])

      if (dashboardRes) {
        const dashboardData = await dashboardRes.json()
        if ((dashboardRes as Response).ok !== false) {
          const toCache = {
            competitions: Array.isArray(dashboardData.competitions) ? dashboardData.competitions : [],
            userPicks: Array.isArray(dashboardData.userPicks) ? dashboardData.userPicks : [],
            userRank: dashboardData.userRank ?? null,
          }
          clientCache.set(CACHE_KEY, toCache, 2 * 60 * 1000)
          setCompetitions(toCache.competitions)
          setUserPicks(toCache.userPicks)
          setUserRank(toCache.userRank)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    setJoiningByCode(true)
    setJoinError('')
    try {
      const res = await fetch('/api/competitions/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setJoinError(data.error || 'Failed to join competition')
        return
      }
      setShowJoinModal(false)
      setJoinCode('')
      router.push(`/lobby/${data.competitionId}`)
    } catch {
      setJoinError('An error occurred. Please try again.')
    } finally {
      setJoiningByCode(false)
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
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-charcoal font-display">
                G&apos;day, <span className="text-primary">{session?.user?.name?.split(' ')[0] || 'Tipster'}</span>
              </h1>
              <p className="text-foreground text-lg">Here&apos;s what&apos;s happening.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowJoinModal(true); setJoinError(''); setJoinCode('') }}
                className="glass-card px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover-elevate hover:border-primary/50 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Join Private League
              </button>
              <Link
                href="/lobby/create"
                className="glass-button px-3 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 hover-elevate hover:bg-card/50 hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Private League
              </Link>
            </div>
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
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        <MainEventCard competitions={competitions} />

        {/* Empty State */}
        {competitions.length === 0 && upcomingGames.length === 0 && recentResults.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2 font-display">No Events Yet</h2>
            <p className="text-muted-foreground mb-6">Competitions and games will appear here once they&apos;re available.</p>
            <Link
              href="/lobby"
              className="glass-button px-5 py-2.5 rounded-lg text-sm font-semibold hover-elevate inline-block"
            >
              Browse Lobby
            </Link>
          </div>
        )}

        {/* Upcoming / Live Matches */}
        {upcomingGames.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 gold-accent" />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">Upcoming / Live Matches</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(showAllUpcoming ? upcomingGames : upcomingGames.slice(0, 6)).map((game) => (
                <GameCard key={game.id} game={game} pick={findPickForGame(game, userPicks)} />
              ))}
            </div>
            {upcomingGames.length > 6 && (
              <button
                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                className="mt-3 w-full text-xs font-semibold text-muted-foreground hover:text-foreground py-2.5 border border-border/50 rounded-xl hover:bg-muted/20 transition-colors"
              >
                {showAllUpcoming ? 'Show less' : `Show ${upcomingGames.length - 6} more`}
              </button>
            )}
          </section>
        )}

        {/* Results */}
        {recentResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#4CAF50' }} />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">Results</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(showAllResults ? recentResults : recentResults.slice(0, 6)).map((game) => (
                <GameCard key={game.id} game={game} pick={findPickForGame(game, userPicks)} />
              ))}
            </div>
            {recentResults.length > 6 && (
              <button
                onClick={() => setShowAllResults(!showAllResults)}
                className="mt-3 w-full text-xs font-semibold text-muted-foreground hover:text-foreground py-2.5 border border-border/50 rounded-xl hover:bg-muted/20 transition-colors"
              >
                {showAllResults ? 'Show less' : `Show ${recentResults.length - 6} more`}
              </button>
            )}
          </section>
        )}
      </div>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onComplete={() => {
          setShowProfileModal(false)
          setProfileCompleted(true)
        }}
      />

      {/* Join Private League Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Join a Private League</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the invite code shared by the league commissioner.
            </p>
            <input
              placeholder="e.g. ABC12345"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
              disabled={joiningByCode}
            />
            {joinError && (
              <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {joinError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinByCode}
                disabled={!joinCode.trim() || joiningByCode}
                className="flex-1 px-4 py-2 rounded-lg brand-gradient text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningByCode ? 'Joining...' : 'Join League'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
