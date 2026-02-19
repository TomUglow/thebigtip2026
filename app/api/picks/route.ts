import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pickSchema } from '@/lib/validations'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')

    const whereClause: any = { userId }

    if (competitionId) {
      whereClause.competitionId = competitionId
    }

    const picks = await prisma.pick.findMany({
      where: whereClause,
      select: {
        id: true,
        eventId: true,
        competitionId: true,
        selectedTeam: true,
        isCorrect: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(picks)
  } catch (error) {
    console.error('Error fetching picks:', error)
    return apiError('Failed to fetch picks', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()

    // Validate input
    const result = pickSchema.safeParse(body)
    if (!result.success) {
      console.error('Pick validation error:', result.error.errors)
      return apiError('Invalid pick data', 400)
    }

    const { eventId, competitionId, selectedTeam } = result.data

    // Verify user is a member of this competition
    const membership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
    })
    if (!membership) {
      return apiError('Not a member of this competition', 403)
    }

    // Verify the event belongs to this competition
    const competitionEvent = await prisma.competitionEvent.findUnique({
      where: { competitionId_eventId: { competitionId, eventId } },
    })
    if (!competitionEvent) {
      return apiError('Event does not belong to this competition', 404)
    }

    // Fetch event to validate
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        options: true,
        status: true,
        eventDate: true,
      },
    })

    if (!event) {
      return apiError('Event not found', 404)
    }

    // Validate selectedTeam exists in event's options
    const optionsArray = Array.isArray(event.options) ? event.options : []
    if (!optionsArray.includes(selectedTeam)) {
      return apiError('Selected team is not a valid option for this event', 400)
    }

    // Prevent picks on completed events
    if (event.status === 'completed') {
      return apiError('Cannot pick on completed events', 400)
    }

    // Prevent picks on events that have already started
    const eventDate = new Date(event.eventDate)
    if (eventDate <= new Date()) {
      return apiError('Event has already started', 400)
    }

    // Upsert pick scoped to this competition
    const pick = await prisma.pick.upsert({
      where: {
        userId_eventId_competitionId: {
          userId,
          eventId,
          competitionId,
        },
      },
      update: { selectedTeam },
      create: { userId, eventId, competitionId, selectedTeam },
    })

    return apiSuccess(pick, 201)
  } catch (error) {
    console.error('Error creating/updating pick:', error)
    return apiError('Failed to save pick', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { searchParams } = new URL(request.url)
    const pickId = searchParams.get('id')

    if (!pickId) {
      return apiError('Pick ID required', 400)
    }

    await prisma.pick.delete({
      where: {
        id: pickId,
        userId, // Ensure user owns the pick
      },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting pick:', error)
    return apiError('Failed to delete pick', 500)
  }
}
