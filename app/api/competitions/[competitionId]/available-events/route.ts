import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * Get platform events not yet in this competition (for event request picker)
 * GET /api/competitions/[competitionId]/available-events
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { competitionId } = params

    // Verify user is a member of this competition
    const membership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
      select: { role: true },
    })
    if (!membership) return apiError('Not a member of this competition', 403)

    // Find event IDs already linked to this competition
    const linked = await prisma.competitionEvent.findMany({
      where: { competitionId },
      select: { eventId: true },
    })
    const linkedIds = linked.map((ce) => ce.eventId)

    // Return upcoming/live events not already in the competition
    const events = await prisma.event.findMany({
      where: {
        status: { not: 'completed' },
        ...(linkedIds.length > 0 ? { id: { notIn: linkedIds } } : {}),
      },
      select: {
        id: true,
        title: true,
        sport: true,
        eventDate: true,
        team1Name: true,
        team2Name: true,
      },
      orderBy: [{ sport: 'asc' }, { eventDate: 'asc' }],
      take: 200,
    })

    return apiSuccess({ events })
  } catch (error) {
    console.error('Error fetching available events:', error)
    return apiError('Failed to fetch available events', 500)
  }
}
