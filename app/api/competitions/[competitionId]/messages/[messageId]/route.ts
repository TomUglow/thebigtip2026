import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * Approve or reject an event_request message (commissioners only)
 * PATCH /api/competitions/[competitionId]/messages/[messageId]
 * Body: { action: "approve" | "reject" }
 *
 * On approve: links the existing platform event to the competition
 * On reject:  marks the request as rejected
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

    // action === 'approve': link the existing event to the competition
    const meta = message.requestMeta as {
      eventId: string
      eventTitle?: string
      sport?: string
      eventDate?: string
    }

    if (!meta?.eventId) {
      return apiError('Event request is missing the event reference', 422)
    }

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: meta.eventId },
    })
    if (!event) {
      return apiError('The requested event no longer exists', 404)
    }

    const [updatedMessage] = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.update({
        where: { id: messageId },
        data: {
          status: 'approved',
          resolvedBy: userId,
          resolvedAt: new Date(),
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      })

      // Link event to competition (ignore if already linked)
      await tx.competitionEvent.upsert({
        where: { competitionId_eventId: { competitionId, eventId: meta.eventId } },
        create: { competitionId, eventId: meta.eventId },
        update: {},
      })

      return [msg]
    })

    return apiSuccess({ message: updatedMessage, event })
  } catch (error) {
    console.error('Error resolving event request:', error)
    return apiError('Failed to resolve event request', 500)
  }
}
