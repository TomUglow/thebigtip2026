import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/odds?eventId=... - Get odds history for an event
 * POST /api/odds - Fetch and store latest odds from API
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return apiError('Event ID required', 400)
    }

    // Get latest odds snapshot for this event
    const odds = await prisma.oddsSnapshot.findMany({
      where: { eventId },
      select: {
        id: true,
        team: true,
        odds: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return apiSuccess(odds)
  } catch (error) {
    console.error('Error fetching odds:', error)
    return apiError('Failed to fetch odds', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement odds fetching from the-odds-api.com
    // 1. Fetch current odds for all events
    // 2. Compare with latest snapshot in DB
    // 3. Store new snapshots if odds changed
    // 4. Trigger notifications for market movers (>5% change)

    return apiError('Odds sync coming soon', 501)
  } catch (error) {
    console.error('Error syncing odds:', error)
    return apiError('Failed to sync odds', 500)
  }
}
