import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { competitionCreateSchema } from '@/lib/validations'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

function generateInviteCode(): string {
  // 8-character uppercase alphanumeric, excluding easily confused chars (O, 0, I, 1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(
    randomBytes(8),
    (b: number) => chars[b % chars.length]
  ).join('')
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const competitions = await prisma.competition.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(session?.user?.id
            ? [{ users: { some: { userId: session.user.id } } }]
            : []),
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, events: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Check which competitions the current user has joined
    const joinedCompIds = new Set<string>()
    if (session?.user?.id) {
      const memberships = await prisma.competitionUser.findMany({
        where: { userId: session.user.id },
        select: { competitionId: true },
      })
      memberships.forEach((m) => joinedCompIds.add(m.competitionId))
    }

    const result = competitions.map((comp) => ({
      ...comp,
      participantCount: comp._count.users,
      eventCount: comp._count.events,
      isJoined: joinedCompIds.has(comp.id),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return apiError('Failed to fetch competitions', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()

    // Validate input
    const result = competitionCreateSchema.safeParse(body)
    if (!result.success) {
      console.error('Competition validation error:', result.error.errors)
      return apiError('Invalid competition data', 400)
    }

    const { name, description, startDate, eventIds } = result.data

    // Verify all events exist and haven't completed
    const validEvents = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
        status: { not: 'completed' },
      },
      select: { id: true, eventDate: true },
      orderBy: { eventDate: 'desc' },
    })

    if (validEvents.length !== eventIds.length) {
      return apiError('Some selected events are invalid or already completed', 400)
    }

    // endDate = latest event date
    const endDate = validEvents[0].eventDate

    const parsedStartDate = new Date(startDate)
    if (isNaN(parsedStartDate.getTime()) || parsedStartDate <= new Date()) {
      return apiError('Tips close date must be a valid future date', 400)
    }

    if (parsedStartDate > endDate) {
      return apiError('Tips close date must be before the last event date', 400)
    }

    // Create competition, link events, and auto-join creator in a transaction
    const competition = await prisma.$transaction(async (tx) => {
      const comp = await tx.competition.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          entryFee: 0,
          prizePool: 0,
          startDate: parsedStartDate,
          endDate,
          isPublic: false,
          inviteCode: generateInviteCode(),
          maxEvents: eventIds.length,
          status: 'upcoming',
          ownerId: userId,
        },
      })

      await tx.competitionEvent.createMany({
        data: eventIds.map((eventId: string) => ({
          competitionId: comp.id,
          eventId,
        })),
      })

      await tx.competitionUser.create({
        data: {
          userId,
          competitionId: comp.id,
          role: 'commissioner',
        },
      })

      return comp
    })

    return apiSuccess(
      { success: true, competitionId: competition.id },
      201
    )
  } catch (error) {
    console.error('Error creating competition:', error)
    return apiError('Failed to create competition', 500)
  }
}
