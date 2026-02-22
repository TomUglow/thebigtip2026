import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'
import { getPrizePoolForCompetitions } from '@/lib/competition-helpers'

export const dynamic = 'force-dynamic'

// Server-side in-memory cache keyed by userId (60-second TTL)
interface DashboardCacheEntry { data: any; expiresAt: number }
const _dashboardCache = new Map<string, DashboardCacheEntry>()
const DASHBOARD_CACHE_TTL = 60_000

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    // Serve from server-side cache if still fresh
    const cached = _dashboardCache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return apiSuccess(cached.data)
    }

    // Fetch competitions (public + user's private) and user's picks in parallel
    const [competitions, memberships, picks] = await Promise.all([
      prisma.competition.findMany({
        where: {
          OR: [
            { isPublic: true },
            { users: { some: { userId } } },
          ],
        },
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { users: true, events: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.competitionUser.findMany({
        where: { userId },
        select: { competitionId: true, score: true, rank: true },
      }),
      prisma.pick.findMany({
        where: { userId },
        select: {
          id: true,
          eventId: true,
          selectedTeam: true,
          isCorrect: true,
          points: true,
        },
      }),
    ])

    const joinedCompIds = new Set(memberships.map((m) => m.competitionId))
    const prizePoolMap = await getPrizePoolForCompetitions(competitions)

    const comps = competitions.map((comp) => ({
      ...comp,
      prizePool: prizePoolMap.get(comp.id) ?? comp.prizePool,
      participantCount: comp._count.users,
      eventCount: comp._count.events,
      isJoined: joinedCompIds.has(comp.id),
    }))

    // Find main competition for leaderboard
    const mainComp = comps.find(
      (c) => c.isPublic && (c.status === 'active' || c.status === 'upcoming')
    ) || comps[0]

    let userRank: number | null = null
    let leaderboard: any[] = []

    if (mainComp) {
      // Fetch top 5 and current user's entry in parallel (avoids loading all members)
      const [top5, userEntry] = await Promise.all([
        prisma.competitionUser.findMany({
          where: { competitionId: mainComp.id },
          orderBy: { score: 'desc' },
          take: 5,
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        }),
        prisma.competitionUser.findFirst({
          where: { competitionId: mainComp.id, userId },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        }),
      ])

      // Efficient rank: count members with a strictly higher score
      if (userEntry) {
        const above = await prisma.competitionUser.count({
          where: { competitionId: mainComp.id, score: { gt: userEntry.score } },
        })
        userRank = above + 1
      }

      // Build leaderboard: top 5 + current user appended if outside top 5
      leaderboard = top5.map((e, i) => ({ rank: i + 1, user: e.user, score: e.score }))
      const userInTop5 = top5.some((e) => e.userId === userId)
      if (!userInTop5 && userEntry && userRank !== null) {
        leaderboard.push({ rank: userRank, user: userEntry.user, score: userEntry.score })
      }
    }

    const responseData = {
      competitions: comps,
      userPicks: picks,
      userRank,
      leaderboard,
      mainCompetitionId: mainComp?.id || null,
    }

    // Store in server-side cache
    _dashboardCache.set(userId, { data: responseData, expiresAt: Date.now() + DASHBOARD_CACHE_TTL })

    return apiSuccess(responseData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return apiError('Failed to fetch dashboard data', 500)
  }
}
