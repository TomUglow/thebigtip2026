import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
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
                      where: { userId: session.user.id },
                      select: {
                        id: true,
                        eventId: true,
                        selectedTeam: true,
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

    const isJoined = session?.user?.id
      ? competition.users.some((u) => u.userId === session.user.id)
      : false

    // Flatten events from CompetitionEvent join table and sort by eventNumber
    const events = competition.events
      .map((ce) => ce.event)
      .sort((a, b) => (a.eventNumber ?? 0) - (b.eventNumber ?? 0))

    // Extract user picks from the events
    const userPicks = events.flatMap((e) => e.picks || [])

    // Build leaderboard with ranks
    const leaderboard = competition.users.map((entry, index) => ({
      rank: index + 1,
      user: entry.user,
      score: entry.score,
    }))

    // Strip picks from event objects to avoid duplication
    const cleanEvents = events.map(({ picks, ...event }) => event)

    return NextResponse.json({
      id: competition.id,
      name: competition.name,
      description: competition.description,
      entryFee: competition.entryFee,
      prizePool: competition.prizePool,
      startDate: competition.startDate,
      endDate: competition.endDate,
      isPublic: competition.isPublic,
      maxEvents: competition.maxEvents,
      status: competition.status,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
      ownerId: competition.ownerId,
      owner: competition.owner,
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
