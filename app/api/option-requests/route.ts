import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const optionRequestSchema = z.object({
  eventId: z.string().min(1),
  competitionId: z.string().min(1),
  suggestedOption: z.string().min(1).max(200).transform((s) => s.trim()),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()
    const result = optionRequestSchema.safeParse(body)
    if (!result.success) {
      return apiError('Invalid request data', 400)
    }

    const { eventId, competitionId, suggestedOption } = result.data

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
        title: true,
        allowOptionRequests: true,
        status: true,
        eventDate: true,
      },
    })
    if (!event) {
      return apiError('Event not found', 404)
    }
    if (!event.allowOptionRequests) {
      return apiError('This event does not accept option requests', 400)
    }
    if (event.status === 'completed') {
      return apiError('Cannot request options on completed events', 400)
    }
    if (new Date(event.eventDate) <= new Date()) {
      return apiError('Event has already started', 400)
    }

    // Use a transaction to upsert the pick and create/replace the option request
    const { pick, optionRequest } = await prisma.$transaction(async (tx) => {
      // Delete any existing pending option request for this user+event+competition
      await tx.optionRequest.deleteMany({
        where: { userId, eventId, competitionId, status: 'pending' },
      })

      // Upsert the pick as pending
      const savedPick = await tx.pick.upsert({
        where: { userId_eventId_competitionId: { userId, eventId, competitionId } },
        update: { selectedTeam: suggestedOption, isPending: true, isCorrect: null, points: 0 },
        create: { userId, eventId, competitionId, selectedTeam: suggestedOption, isPending: true },
      })

      // Create the option request
      const savedRequest = await tx.optionRequest.create({
        data: {
          eventId,
          userId,
          competitionId,
          suggestedOption,
          status: 'pending',
        },
      })

      return { pick: savedPick, optionRequest: savedRequest }
    })

    return apiSuccess({ pick, optionRequest }, 201)
  } catch (error) {
    console.error('Error creating option request:', error)
    return apiError('Failed to submit option request', 500)
  }
}
