import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-helpers'
import { getPrizePoolForCompetition } from '@/lib/competition-helpers'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { competitionId } = params

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        owner: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, events: true },
        },
        events: {
          include: {
            event: {
              include: {
                picks: session?.user?.id
                  ? {
                      where: { userId: session.user.id, competitionId },
                      select: {
                        id: true,
                        eventId: true,
                        competitionId: true,
                        selectedTeam: true,
                        isPending: true,
                        isCorrect: true,
                        points: true,
                      },
                    }
                  : false,
              },
            },
          },
        },
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    type MemberEntry = typeof competition.users[number]
    type EventEntry = typeof competition.events[number]

    const isJoined = session?.user?.id
      ? competition.users.some((u: MemberEntry) => u.userId === session.user.id)
      : false

    // Determine if the current user is a commissioner (role-based, not ownerId)
    const currentUserEntry = session?.user?.id
      ? competition.users.find((u: MemberEntry) => u.userId === session.user.id)
      : null
    const currentUserIsCommissioner = currentUserEntry?.role === 'commissioner'

    // Flatten events from CompetitionEvent join table and sort by eventNumber
    type RawEvent = EventEntry['event']
    const events = competition.events
      .map((ce: EventEntry) => ce.event)
      .sort((a: RawEvent, b: RawEvent) => (a.eventNumber ?? 0) - (b.eventNumber ?? 0))

    // Extract user picks from the events
    type RawEventWithPicks = RawEvent & { picks?: unknown[] }
    const userPicks = events.flatMap((e: RawEventWithPicks) => e.picks || [])

    // Build leaderboard with ranks and role
    const leaderboard = competition.users.map((entry: MemberEntry, index: number) => ({
      rank: index + 1,
      user: entry.user,
      score: entry.score,
      role: entry.role,
    }))

    // Strip picks from event objects to avoid duplication
    type EventWithPicks = (typeof events)[number] & { picks?: unknown }
    const cleanEvents = events.map((event: EventWithPicks) => {
      const { picks: _picks, ...rest } = event
      return rest
    })

    const displayPrizePool = await getPrizePoolForCompetition(
      competition.id,
      competition.entryFee,
      competition.prizePool
    )

    return NextResponse.json({
      id: competition.id,
      name: competition.name,
      description: competition.description,
      entryFee: competition.entryFee,
      prizePool: displayPrizePool,
      startDate: competition.startDate,
      endDate: competition.endDate,
      isPublic: competition.isPublic,
      maxEvents: competition.maxEvents,
      status: competition.status,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
      ownerId: competition.ownerId,
      owner: competition.owner,
      // Only expose the invite code to commissioners of private competitions
      inviteCode: currentUserIsCommissioner && !competition.isPublic ? competition.inviteCode : null,
      currentUserIsCommissioner,
      participantCount: competition._count.users,
      eventCount: competition._count.events,
      isJoined,
      events: cleanEvents,
      userPicks,
      leaderboard,
    })
  } catch (error) {
    console.error('Error fetching competition:', error)
    return NextResponse.json({ error: 'Failed to fetch competition' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { competitionId } = params

    // Verify the user is a commissioner of this competition
    const membership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
      select: { role: true },
    })

    if (!membership || membership.role !== 'commissioner') {
      return NextResponse.json({ error: 'Only commissioners can delete a competition' }, { status: 403 })
    }

    // Delete competition — cascades to CompetitionUser, CompetitionEvent, Pick, Payment
    await prisma.competition.delete({ where: { id: competitionId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json({ error: 'Failed to delete competition' }, { status: 500 })
  }
}
