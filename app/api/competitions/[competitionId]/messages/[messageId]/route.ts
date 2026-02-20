import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * Approve or reject an event request message (commissioners only)
 * PATCH /api/competitions/[competitionId]/messages/[messageId]
 * Body: { action: "approve" | "reject" }
 *
 * On approve: auto-creates the event and links it to the competition
 * On reject: marks the request as rejected
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { competitionId: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { competitionId, messageId } = params

    // Only commissioners can approve/reject event requests
    const membership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
      select: { role: true },
    })
    if (!membership || membership.role !== 'commissioner') {
      return apiError('Only commissioners can approve or reject event requests', 403)
    }

    const body = await request.json()
    const action: string = body.action
    if (action !== 'approve' && action !== 'reject') {
      return apiError('Invalid action — must be "approve" or "reject"', 400)
    }

    // Find the pending event request message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        competitionId,
        type: 'event_request',
        status: 'pending',
      },
    })
    if (!message) {
      return apiError('Event request not found or already resolved', 404)
    }

    if (action === 'reject') {
      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'rejected',
          resolvedBy: userId,
          resolvedAt: new Date(),
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      })
      return apiSuccess({ message: updated })
    }

    // action === 'approve': create the event and link it to the competition
    const meta = message.requestMeta as {
      sport: string
      eventTitle: string
      eventDate: string
      options: string[]
    }

    if (!meta || !meta.sport || !meta.eventTitle || !meta.eventDate || !meta.options?.length) {
      return apiError('Event request has invalid metadata', 422)
    }

    const [updatedMessage, newEvent] = await prisma.$transaction(async (tx) => {
      // Update message status
      const msg = await tx.message.update({
        where: { id: messageId },
        data: {
          status: 'approved',
          resolvedBy: userId,
          resolvedAt: new Date(),
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      })

      // Create the event
      const event = await tx.event.create({
        data: {
          sport: meta.sport,
          title: meta.eventTitle,
          eventDate: new Date(meta.eventDate),
          options: meta.options,
          status: 'upcoming',
        },
      })

      // Link event to the competition
      await tx.competitionEvent.create({
        data: {
          competitionId,
          eventId: event.id,
        },
      })

      return [msg, event]
    })

    return apiSuccess({ message: updatedMessage, event: newEvent })
  } catch (error) {
    console.error('Error resolving event request:', error)
    return apiError('Failed to resolve event request', 500)
  }
}
