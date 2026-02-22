export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
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

const emptyProps = {
  userName: null as string | null,
  competitions: [] as Competition[],
  userPicks: [] as any[],
  userRank: null as number | null,
  leaderboard: [] as { rank: number; user: { id: string; name: string | null; email: string; avatar: string | null }; score: number }[],
  mainCompetitionId: null as string | null,
}

export default async function DashboardPage() {
  // Get session — if it fails or is missing, middleware/AuthGuard will redirect
  let session: Session | null = null
  try {
    session = await getServerSession(authOptions)
  } catch (err) {
    console.error('getServerSession failed:', err)
  }

  const userId = session?.user?.id
  if (!userId) {
    // Middleware already redirects unauthenticated users; this is a fallback
    return <DashboardClient {...emptyProps} userName={session?.user?.name ?? null} />
  }

  // Fetch all three base queries in parallel
  let competitions: CompetitionRow[] = []
  let memberships: MembershipRow[] = []
  let picks: any[] = []

  try {
    const results = await Promise.all([
      prisma.competition.findMany({
        where: {
          OR: [
            { isPublic: true, status: { in: ['active', 'upcoming'] } },
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
    competitions = results[0] as CompetitionRow[]
    memberships = results[1] as MembershipRow[]
    picks = results[2]
  } catch (err) {
    console.error('Dashboard DB query failed:', err)
    return <DashboardClient {...emptyProps} userName={session?.user?.name ?? null} dbError={true} />
  }

  const joinedCompIds = new Set(memberships.map((m) => m.competitionId))

  const comps: Competition[] = competitions.map((comp) => ({
    id: comp.id,
    name: comp.name,
    description: comp.description,
    entryFee: comp.entryFee,
    prizePool: comp.prizePool,
    startDate: comp.startDate?.toISOString() ?? new Date().toISOString(),
    endDate: comp.endDate?.toISOString() ?? new Date().toISOString(),
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

  const mainComp = comps.find(
    (c) => c.isPublic && (c.status === 'active' || c.status === 'upcoming')
  ) ?? comps[0]

  let userRank: number | null = null
  let leaderboard: typeof emptyProps.leaderboard = []

  if (mainComp) {
    try {
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
        leaderboard.push({ rank: userRank, user: (userEntry as unknown as LeaderboardRow).user, score: userEntry.score })
      }
    } catch (err) {
      console.error('Dashboard leaderboard query failed:', err)
      // leaderboard stays empty, page still renders
    }
  }

  return (
    <DashboardClient
      userName={session?.user?.name ?? null}
      competitions={comps}
      userPicks={picks}
      userRank={userRank}
      leaderboard={leaderboard}
      mainCompetitionId={mainComp?.id ?? null}
    />
  )
}
