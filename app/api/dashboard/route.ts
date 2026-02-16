import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

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

    const comps = competitions.map((comp) => ({
      ...comp,
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
      // Get user's rank
      const allCompUsers = await prisma.competitionUser.findMany({
        where: { competitionId: mainComp.id },
        orderBy: { score: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      })

      const userIdx = allCompUsers.findIndex((e) => e.userId === userId)
      if (userIdx !== -1) {
        userRank = userIdx + 1
      }

      // Get top 5 + surrounding positions (from position-2 to position+2 if possible)
      const topCount = 5
      const surroundingRange = 2
      const startIdx = Math.max(0, userIdx - surroundingRange)
      const endIdx = Math.min(allCompUsers.length, userIdx + surroundingRange + 1)

      // Get top 5 entries
      const topEntries = allCompUsers.slice(0, topCount)
      // Get surrounding entries if user is outside top 5
      const surroundingEntries =
        userIdx >= topCount ? allCompUsers.slice(startIdx, endIdx) : []

      // Combine and deduplicate
      const leaderboardMap = new Map<string, any>()
      topEntries.forEach((entry, idx) => {
        leaderboardMap.set(entry.userId, {
          rank: idx + 1,
          user: entry.user,
          score: entry.score,
        })
      })

      surroundingEntries.forEach((entry, idx) => {
        const rank = startIdx + idx + 1
        if (!leaderboardMap.has(entry.userId)) {
          leaderboardMap.set(entry.userId, {
            rank,
            user: entry.user,
            score: entry.score,
          })
        }
      })

      leaderboard = Array.from(leaderboardMap.values()).sort(
        (a, b) => a.rank - b.rank
      )
    }

    return apiSuccess({
      competitions: comps,
      userPicks: picks,
      userRank,
      leaderboard,
      mainCompetitionId: mainComp?.id || null,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return apiError('Failed to fetch dashboard data', 500)
  }
}
