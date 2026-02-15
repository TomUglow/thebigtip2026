import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

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

    // Find main competition for rank lookup
    const mainComp = comps.find(
      (c) => c.isPublic && (c.status === 'active' || c.status === 'upcoming')
    ) || comps[0]

    let userRank: number | null = null
    if (mainComp) {
      // Get rank from leaderboard position
      const leaderboard = await prisma.competitionUser.findMany({
        where: { competitionId: mainComp.id },
        orderBy: { score: 'desc' },
        select: { userId: true },
      })
      const idx = leaderboard.findIndex((e) => e.userId === userId)
      if (idx !== -1) userRank = idx + 1
    }

    return NextResponse.json({
      competitions: comps,
      userPicks: picks,
      userRank,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
