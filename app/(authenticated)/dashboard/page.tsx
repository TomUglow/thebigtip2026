export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'
import type { Competition } from '@/lib/types'

// Local types matching the Prisma query shapes used below
interface MembershipRow { competitionId: string; score: number; rank: number | null }
interface CompetitionRow {
  id: string; name: string; description: string | null; entryFee: number; prizePool: number
  startDate: Date; endDate: Date; isPublic: boolean; maxEvents: number; status: string
  ownerId: string; owner: { id: string; name: string | null }; inviteCode: string | null
  _count: { users: number; events: number }
}
interface LeaderboardRow {
  userId: string; score: number
  user: { id: string; name: string | null; email: string; avatar: string | null }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // All three queries run in parallel on the server — no client round-trip needed
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

  const joinedCompIds = new Set((memberships as MembershipRow[]).map((m) => m.competitionId))

  const comps: Competition[] = (competitions as CompetitionRow[]).map((comp) => ({
    id: comp.id,
    name: comp.name,
    description: comp.description,
    entryFee: comp.entryFee,
    prizePool: comp.prizePool,
    startDate: comp.startDate.toISOString(),
    endDate: comp.endDate.toISOString(),
    isPublic: comp.isPublic,
    maxEvents: comp.maxEvents,
    status: comp.status,
    ownerId: comp.ownerId,
    owner: comp.owner,
    inviteCode: comp.inviteCode,
    participantCount: comp._count.users,
    eventCount: comp._count.events,
    isJoined: joinedCompIds.has(comp.id),
  }))

  // Find main competition for leaderboard
  const mainComp = comps.find(
    (c) => c.isPublic && (c.status === 'active' || c.status === 'upcoming')
  ) ?? comps[0]

  let userRank: number | null = null
  let leaderboard: { rank: number; user: { id: string; name: string | null; email: string; avatar: string | null }; score: number }[] = []

  if (mainComp) {
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

    if (userEntry) {
      const above = await prisma.competitionUser.count({
        where: { competitionId: mainComp.id, score: { gt: userEntry.score } },
      })
      userRank = above + 1
    }

    leaderboard = (top5 as LeaderboardRow[]).map((e, i) => ({ rank: i + 1, user: e.user, score: e.score }))
    const userInTop5 = (top5 as LeaderboardRow[]).some((e) => e.userId === userId)
    if (!userInTop5 && userEntry && userRank !== null) {
      leaderboard.push({ rank: userRank, user: userEntry.user, score: userEntry.score })
    }
  }

  return (
    <DashboardClient
      userName={session.user.name ?? null}
      competitions={comps}
      userPicks={picks}
      userRank={userRank}
      leaderboard={leaderboard}
      mainCompetitionId={mainComp?.id ?? null}
    />
  )
}
