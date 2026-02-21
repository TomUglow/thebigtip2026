import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const eventRequestSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  eventTitle: z.string().min(1, 'Event title is required').max(200),
  eventDate: z.string().optional(),
  options: z.string().optional(),
})

/**
 * Publicly request a new event be added to the platform
 * POST /api/event-requests
 *
 * Any authenticated user can submit. Creates admin notifications for review.
 * Admin reviews in the Requests tab and creates the event if approved.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()
    const result = eventRequestSchema.safeParse(body)
    if (!result.success) {
      return apiError('Invalid request data', 400)
    }

    const { sport, eventTitle, eventDate, options } = result.data
    const senderName = session!.user?.name ?? 'A user'

    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    })

    if (admins.length > 0) {
      const requestMeta = {
        sport,
        eventTitle,
        ...(eventDate && { eventDate }),
        ...(options?.trim() && { options: options.trim() }),
      }

      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'platform_event_request',
          title: 'New Event Suggestion',
          message: `${senderName} suggested a new event: ${eventTitle} (${sport})`,
          data: { requestMeta } as unknown as Prisma.InputJsonValue,
        })),
      })
    }

    return apiSuccess({ success: true }, 201)
  } catch (error) {
    console.error('Error submitting event request:', error)
    return apiError('Failed to submit event request', 500)
  }
}
