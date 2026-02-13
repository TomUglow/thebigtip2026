'use client'

import { useState, useEffect, useRef } from 'react'
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns'
import { Circle, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ScoreGame } from '@/lib/types'

function TickerCard({ game }: { game: ScoreGame }) {
  const commence = new Date(game.commenceTime)
  const now = new Date()
  const hoursUntil = differenceInHours(commence, now)
  const isLive = game.scores && !game.completed
  const isCompleted = game.completed
  const isUpcoming = !isCompleted && !isLive && commence > now

  let timeLabel: string
  if (isLive) {
    timeLabel = 'LIVE'
  } else if (isCompleted) {
    timeLabel = 'FT'
  } else if (isToday(commence)) {
    timeLabel = format(commence, 'h:mm a')
  } else if (isTomorrow(commence)) {
    timeLabel = `Tomorrow ${format(commence, 'h:mm a')}`
  } else {
    timeLabel = format(commence, 'EEE d MMM')
  }

  const homeScore = game.scores?.find((s) => s.name === game.homeTeam)?.score
  const awayScore = game.scores?.find((s) => s.name === game.awayTeam)?.score
  const sportColor = SPORT_COLORS[game.sport] || 'hsl(var(--muted-foreground))'
  const hasScores = homeScore != null && awayScore != null

  return (
    <div
      className={`flex-shrink-0 flex flex-col gap-1 px-4 py-2 border-r border-border last:border-r-0 min-w-[180px] ${
        isCompleted ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0 h-4 flex items-center rounded border"
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="text-xs font-semibold truncate">{game.homeTeam}</div>
          <div className="text-xs font-semibold truncate text-muted-foreground">{game.awayTeam}</div>
        </div>
        {(isLive || isCompleted) && hasScores && (
          <div className="flex flex-col gap-0.5 items-end flex-shrink-0">
            <div className="text-xs font-bold tabular-nums">{homeScore}</div>
            <div className="text-xs font-bold tabular-nums text-muted-foreground">{awayScore}</div>
          </div>
        )}
        {isUpcoming && hoursUntil <= 24 && hoursUntil > 0 && (
          <div className="flex-shrink-0 text-[10px] text-muted-foreground font-medium">
            {hoursUntil}h
          </div>
        )}
      </div>
    </div>
  )
}

export default function LiveScoresTicker() {
  const [scores, setScores] = useState<ScoreGame[]>([])
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores')
        const data = await res.json()
        if (Array.isArray(data)) {
          // Order: completed (oldest first) → live → upcoming
          // So users can scroll left to see past results
          const completed = data.filter((g: ScoreGame) => g.completed)
            .sort((a: ScoreGame, b: ScoreGame) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime())
          const live = data.filter((g: ScoreGame) => g.scores && !g.completed)
          const upcoming = data.filter((g: ScoreGame) => !g.scores && !g.completed)
            .sort((a: ScoreGame, b: ScoreGame) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime())
          setScores([...completed, ...live, ...upcoming].slice(0, 30))
        }
      } catch {
        // Ticker is non-critical — fail silently
      } finally {
        setLoaded(true)
      }
    }

    fetchScores()
    const interval = setInterval(fetchScores, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el && scores.length > 0) {
      // Auto-scroll to the first live or upcoming game (past results are on the left)
      const completedCount = scores.filter(g => g.completed).length
      if (completedCount > 0) {
        const cardWidth = 180 // min-w-[180px]
        el.scrollLeft = Math.max(0, (completedCount - 1) * cardWidth)
      }
    }
    updateScrollState()
    if (el) el.addEventListener('scroll', updateScrollState)
    return () => { el?.removeEventListener('scroll', updateScrollState) }
  }, [scores])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  if (!loaded || scores.length === 0) return null

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm relative">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="flex items-center gap-0">
          {/* Label */}
          <div className="flex-shrink-0 flex items-center gap-2 pr-3 border-r border-border py-2">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground whitespace-nowrap">
              Live & Results
            </span>
          </div>

          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Scrollable Cards */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide flex-1"
          >
            {scores.map((game) => (
              <TickerCard key={game.id} game={game} />
            ))}
          </div>

          {/* Right Scroll Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
