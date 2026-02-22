'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInHours, differenceInMinutes, differenceInDays } from 'date-fns'
import {
  Trophy, Target, TrendingUp, Calendar, CheckCircle2, Circle, Users, Plus, Lock, X,
  ChevronLeft, ChevronRight, Globe,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ScoreGame, Competition } from '@/lib/types'
import MainEventCard from '@/components/dashboard/MainEventCard'
import ProfileCompletionModal from '@/components/dashboard/ProfileCompletionModal'

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

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
    <div className={`glass-card rounded-xl p-3 flex flex-col gap-2 h-full hover-elevate ${isCompleted ? 'opacity-80' : ''}`}>
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
            FT · {formatTimeAgo(game.commenceTime)}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium">{timeLabel}</span>
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2 text-xs font-semibold">
          <span className="leading-snug min-w-0 break-words">{game.homeTeam}</span>
          {hasScores && <span className="font-bold tabular-nums flex-shrink-0">{homeScore}</span>}
        </div>
        <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
          <span className="leading-snug min-w-0 break-words">{game.awayTeam}</span>
          {hasScores && <span className="font-bold tabular-nums flex-shrink-0">{awayScore}</span>}
        </div>
      </div>
      {pick && (
        <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border ${
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

function GameRowScroller({ games, userPicks }: { games: ScoreGame[]; userPicks: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentCol, setCurrentCol] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const columns: ScoreGame[][] = []
  for (let i = 0; i + 1 < games.length; i += 2) {
    columns.push([games[i], games[i + 1]])
  }
  const totalCols = columns.length

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setAtStart(el.scrollLeft <= 0)
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const getColWidth = (): number => {
    const firstChild = scrollRef.current?.firstElementChild as HTMLElement | null
    return firstChild ? firstChild.offsetWidth + 12 : 0
  }

  const navigate = (dir: 'left' | 'right') => {
    const next = dir === 'right'
      ? Math.min(totalCols - 1, currentCol + 1)
      : Math.max(0, currentCol - 1)
    setCurrentCol(next)
    scrollRef.current?.scrollTo({ left: next * getColWidth(), behavior: 'smooth' })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('left')}
        disabled={atStart}
        className="flex-shrink-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-hidden gap-3"
      >
        {columns.map((col, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-full sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] flex flex-col gap-3 pt-5"
          >
            {col.map((game) => (
              <GameCard key={game.id} game={game} pick={findPickForGame(game, userPicks)} />
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('right')}
        disabled={atEnd}
        className="flex-shrink-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
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
          <span className="text-xs text-muted-foreground w-20 text-center capitalize">
            {competition.status}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}

interface LeaderboardEntry {
  rank: number
  user: { id: string; name: string | null; email: string; avatar: string | null }
  score: number
}

interface DashboardClientProps {
  userName: string | null
  competitions: Competition[]
  userPicks: any[]
  userRank: number | null
  leaderboard: LeaderboardEntry[]
  mainCompetitionId: string | null
  dbError?: boolean
}

export default function DashboardClient({
  userName,
  competitions,
  userPicks,
  userRank,
  leaderboard,
  mainCompetitionId,
  dbError,
}: DashboardClientProps) {
  const router = useRouter()
  const [scores, setScores] = useState<ScoreGame[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joiningByCode, setJoiningByCode] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    // Check profile completion
    fetch('/api/account/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && !data.profileCompleted) {
          setProfileCompleted(false)
          setShowProfileModal(true)
        }
      })
      .catch(() => {})

    // Load scores independently — never blocks content rendering
    fetch('/api/scores')
      .then((r) => r.json())
      .then((d) => setScores(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

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
  const upcomingGames = scores.filter((g) => !g.completed).slice(0, 18)
  const recentResults = scores.filter((g) => g.completed && g.scores).slice(0, 18)

  return (
    <>
      {dbError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-red-500 font-medium">We had trouble loading your data. Some information may be missing.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold text-red-500 hover:text-red-400 underline flex-shrink-0"
          >
            Refresh
          </button>
        </div>
      )}
      {/* Hero Section */}
      <div className="border-b border-white/10 py-12 px-6 relative">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-charcoal font-display">
                Hello <span className="text-primary">{userName?.split(' ')[0] || 'Tipster'}</span>
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

        {/* Upcoming / Live Matches */}
        {upcomingGames.length >= 6 && (
          <section>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 gold-accent" />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">Upcoming / Live Matches</h2>
            </div>
            <GameRowScroller games={upcomingGames} userPicks={userPicks} />
          </section>
        )}

        {/* Results */}
        {recentResults.length >= 6 && (
          <section>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#4CAF50' }} />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">Results</h2>
            </div>
            <GameRowScroller games={recentResults} userPicks={userPicks} />
          </section>
        )}

        {/* My Competitions + Main Event Leaderboard */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Competitions list */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
              <h2 className="text-lg font-bold uppercase tracking-wider font-display">
                My Competitions ({joinedComps.length})
              </h2>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <div className="flex-1">Competition</div>
                <div className="w-16 text-center">Events</div>
                <div className="w-16 text-center">Entries</div>
                <div className="w-20 text-center">Status</div>
                <div className="w-4" />
              </div>
              {joinedComps.length > 0 ? (
                joinedComps.map((comp) => (
                  <CompetitionRow key={comp.id} competition={comp} />
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-4">You haven&apos;t joined any competitions yet.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => { setShowJoinModal(true); setJoinError(''); setJoinCode('') }}
                      className="glass-card px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover-elevate hover:border-primary/50 transition-colors mx-auto"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Join Private League
                    </button>
                    <Link
                      href="/lobby"
                      className="glass-button px-4 py-2 rounded-lg text-xs font-semibold hover-elevate inline-flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Browse Competitions
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main event leaderboard */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
                <h2 className="text-lg font-bold uppercase tracking-wider font-display">Top Tipsters</h2>
              </div>
              {mainCompetitionId && (
                <Link href={`/lobby/${mainCompetitionId}`} className="text-xs text-primary hover:underline font-semibold">
                  Full Leaderboard
                </Link>
              )}
            </div>
            {leaderboard.length > 0 ? (
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <div className="w-6 text-center">#</div>
                  <div className="flex-1">Tipster</div>
                  <div className="w-12 text-right">Score</div>
                </div>
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0"
                  >
                    <div className="w-6 text-center flex-shrink-0">
                      {entry.rank <= 3 ? (
                        <span
                          className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32',
                            color: '#000',
                          }}
                        >
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">{entry.rank}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 brand-gradient rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                        {entry.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium truncate">{entry.user.name || entry.user.email}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums w-12 text-right">{entry.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl py-10 text-center text-muted-foreground">
                <Trophy className="w-7 h-7 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leaderboard data yet.</p>
              </div>
            )}
          </div>

        </section>
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
