import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  sport: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).min(2).optional(),
  allowOptionRequests: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const { eventId } = params
    const body = await request.json()
    const result = updateEventSchema.safeParse(body)
    if (!result.success) {
      return apiError('Invalid event data', 400)
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    })
    if (!event) return apiError('Event not found', 404)

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: result.data,
      select: { id: true, title: true, sport: true, options: true, allowOptionRequests: true },
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error('Admin event PATCH error:', error)
    return apiError('Failed to update event', 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const { eventId } = params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    })
    if (!event) return apiError('Event not found', 404)

    // Cascades to Pick, CompetitionEvent, OddsSnapshot via schema
    await prisma.event.delete({ where: { id: eventId } })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Admin event DELETE error:', error)
    return apiError('Failed to delete event', 500)
  }
}
