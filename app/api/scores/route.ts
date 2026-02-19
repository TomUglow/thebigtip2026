import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const API_KEY = process.env.API_SPORTS_KEY

export interface ScoreGame {
  id: string
  sport: string
  sportKey: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  completed: boolean
  scores: { name: string; score: string }[] | null
  lastUpdate: string | null
}

// Use global to survive Next.js hot-module reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _scoresCache: { data: ScoreGame[]; expiresAt: number } | undefined
}
if (!global._scoresCache) {
  global._scoresCache = { data: [], expiresAt: 0 }
}

// Maximum time to hold cache even if no upcoming events (1 hour)
const MAX_CACHE_MS = 60 * 60 * 1000

// Returns YYYY-MM-DD for today ± offsetDays
function dateStr(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

async function apiSportsFetch(baseUrl: string, path: string): Promise<any> {
  if (!API_KEY) return null
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'x-apisports-key': API_KEY },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`API Sports [${path}]: ${res.status}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.error(`API Sports fetch error [${path}]:`, err)
    return null
  }
}

// ─── Soccer / EPL ────────────────────────────────────────────────────────────
// League 39 = Premier League | Season 2025 = the 2025/26 EPL season
const FOOTBALL_COMPLETED = new Set(['FT', 'AET', 'PEN'])

async function fetchSoccerGames(): Promise<ScoreGame[]> {
  const data = await apiSportsFetch(
    'https://v3.football.api-sports.io',
    `/fixtures?league=39&season=2025&from=${dateStr(-1)}&to=${dateStr(1)}`,
  )
  if (!Array.isArray(data?.response)) return []

  return (data.response as any[]).map((f) => {
    const isCompleted = FOOTBALL_COMPLETED.has(f.fixture.status.short)
    const homeGoals = f.goals?.home
    const awayGoals = f.goals?.away
    const hasScore = homeGoals != null && awayGoals != null

    return {
      id: `soccer-${f.fixture.id}`,
      sport: 'Soccer',
      sportKey: 'soccer_epl',
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      commenceTime: f.fixture.date,
      completed: isCompleted,
      scores: hasScore
        ? [
            { name: f.teams.home.name, score: String(homeGoals) },
            { name: f.teams.away.name, score: String(awayGoals) },
          ]
        : null,
      lastUpdate: f.fixture.date,
    }
  })
}

// ─── Basketball / NBA ────────────────────────────────────────────────────────
// League 12 = NBA | Season 2025-2026
async function fetchBasketballGames(): Promise<ScoreGame[]> {
  const allGames: ScoreGame[] = []

  for (const offset of [-1, 0, 1]) {
    const data = await apiSportsFetch(
      'https://v1.basketball.api-sports.io',
      `/games?league=12&season=2025-2026&date=${dateStr(offset)}`,
    )
    if (!Array.isArray(data?.response)) continue

    for (const g of data.response as any[]) {
      const status = g.status?.short as string
      const isCompleted = status === 'FT' || status === 'AOT'
      const homeTotal = g.scores?.home?.total
      const awayTotal = g.scores?.away?.total

      allGames.push({
        id: `basketball-${g.id}`,
        sport: 'Basketball',
        sportKey: 'basketball_nba',
        homeTeam: g.teams.home.name,
        awayTeam: g.teams.away.name,
        commenceTime: g.date,
        completed: isCompleted,
        scores:
          homeTotal != null && awayTotal != null
            ? [
                { name: g.teams.home.name, score: String(homeTotal) },
                { name: g.teams.away.name, score: String(awayTotal) },
              ]
            : null,
        lastUpdate: null,
      })
    }
  }
  return allGames
}

// ─── Ice Hockey / NHL ────────────────────────────────────────────────────────
// League 57 = NHL | Season 2024-2025
async function fetchHockeyGames(): Promise<ScoreGame[]> {
  const allGames: ScoreGame[] = []

  for (const offset of [-1, 0, 1]) {
    const data = await apiSportsFetch(
      'https://v1.hockey.api-sports.io',
      `/games?league=57&season=2024-2025&date=${dateStr(offset)}`,
    )
    if (!Array.isArray(data?.response)) continue

    for (const g of data.response as any[]) {
      const status = g.status?.short as string
      const isCompleted = status === 'FT' || status === 'AOT'
      const homeScore = g.scores?.home
      const awayScore = g.scores?.away

      allGames.push({
        id: `hockey-${g.id}`,
        sport: 'Ice Hockey',
        sportKey: 'icehockey_nhl',
        homeTeam: g.teams.home.name,
        awayTeam: g.teams.away.name,
        commenceTime: g.date,
        completed: isCompleted,
        scores:
          homeScore != null && awayScore != null
            ? [
                { name: g.teams.home.name, score: String(homeScore) },
                { name: g.teams.away.name, score: String(awayScore) },
              ]
            : null,
        lastUpdate: null,
      })
    }
  }
  return allGames
}

// ─── Rugby League / NRL ──────────────────────────────────────────────────────
// League 2 = NRL in API Sports rugby API | Season 2026
async function fetchNRLGames(): Promise<ScoreGame[]> {
  const allGames: ScoreGame[] = []

  for (const offset of [-1, 0, 1]) {
    const data = await apiSportsFetch(
      'https://v1.rugby.api-sports.io',
      `/games?league=2&season=2026&date=${dateStr(offset)}`,
    )
    if (!Array.isArray(data?.response)) continue

    for (const g of data.response as any[]) {
      const status = g.status?.short as string
      const isCompleted = status === 'FT' || status === 'AOT'
      const homeScore = g.scores?.home
      const awayScore = g.scores?.away

      allGames.push({
        id: `nrl-${g.id}`,
        sport: 'NRL',
        sportKey: 'rugbyleague_nrl',
        homeTeam: g.teams.home.name,
        awayTeam: g.teams.away.name,
        commenceTime: g.date,
        completed: isCompleted,
        scores:
          homeScore != null && awayScore != null
            ? [
                { name: g.teams.home.name, score: String(homeScore) },
                { name: g.teams.away.name, score: String(awayScore) },
              ]
            : null,
        lastUpdate: null,
      })
    }
  }
  return allGames
}

// ─── AFL ─────────────────────────────────────────────────────────────────────
// API Sports AFL API — fetched by date, no league/season filter required
async function fetchAFLGames(): Promise<ScoreGame[]> {
  const allGames: ScoreGame[] = []

  for (const offset of [-1, 0, 1]) {
    const data = await apiSportsFetch(
      'https://v1.afl.api-sports.io',
      `/games?date=${dateStr(offset)}`,
    )
    if (!Array.isArray(data?.response)) continue

    for (const g of data.response as any[]) {
      const status = g.status?.short as string
      const isCompleted = status === 'FT' || status === 'AOT'
      const homeScore = g.scores?.home
      const awayScore = g.scores?.away

      allGames.push({
        id: `afl-${g.id}`,
        sport: 'AFL',
        sportKey: 'aussierules_afl',
        homeTeam: g.teams.home.name,
        awayTeam: g.teams.away.name,
        commenceTime: g.date,
        completed: isCompleted,
        scores:
          homeScore != null && awayScore != null
            ? [
                { name: g.teams.home.name, score: String(homeScore) },
                { name: g.teams.away.name, score: String(awayScore) },
              ]
            : null,
        lastUpdate: null,
      })
    }
  }
  return allGames
}

// ─── Sport → fetcher mapping ──────────────────────────────────────────────────
// Keys must match the `sport` column values in the Event table
const SPORT_FETCHERS: Record<string, () => Promise<ScoreGame[]>> = {
  AFL: fetchAFLGames,
  NRL: fetchNRLGames,
  'Rugby League': fetchNRLGames, // alias — same fetcher
  Basketball: fetchBasketballGames,
  Soccer: fetchSoccerGames,
  'Ice Hockey': fetchHockeyGames,
}

async function getAllScores(): Promise<ScoreGame[]> {
  const now = Date.now()

  // Return cache if still valid
  if (global._scoresCache!.expiresAt > now && global._scoresCache!.data.length > 0) {
    return global._scoresCache!.data
  }

  // Get distinct sports in use + next upcoming event (for smart cache TTL)
  const [eventSports, nextEvent] = await Promise.all([
    prisma.event.findMany({ select: { sport: true }, distinct: ['sport'] }),
    prisma.event.findFirst({
      where: { status: 'upcoming', eventDate: { gt: new Date() } },
      orderBy: { eventDate: 'asc' },
      select: { eventDate: true },
    }),
  ])

  // Deduplicate fetchers (NRL / Rugby League share one function)
  const fetchersToRun: Array<() => Promise<ScoreGame[]>> = []
  const seenFns = new Set<Function>()

  for (const { sport } of eventSports) {
    const fetcher = SPORT_FETCHERS[sport]
    if (fetcher && !seenFns.has(fetcher)) {
      seenFns.add(fetcher)
      fetchersToRun.push(fetcher)
    }
  }

  // Run all fetchers in parallel
  const results = await Promise.all(fetchersToRun.map((f) => f().catch(() => [])))
  const allGames = results.flat()

  // Sort: live/upcoming first (chronological), completed most recent first
  const liveAndUpcoming = allGames
    .filter((g) => !g.completed)
    .sort((a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime())

  const recentResults = allGames
    .filter((g) => g.completed && g.scores)
    .sort((a, b) => new Date(b.commenceTime).getTime() - new Date(a.commenceTime).getTime())

  const combined = [...liveAndUpcoming, ...recentResults]

  // Cache until next event starts (refreshes when games go live),
  // but no longer than MAX_CACHE_MS even if there are no upcoming events.
  const nextEventMs = nextEvent ? new Date(nextEvent.eventDate).getTime() : Infinity
  const expiresAt = Math.min(nextEventMs, now + MAX_CACHE_MS)
  global._scoresCache = { data: combined, expiresAt }

  return combined
}

export async function GET() {
  try {
    const scores = await getAllScores()
    return NextResponse.json(scores)
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}
