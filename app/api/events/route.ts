import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // upcoming, live, completed, all
    const competitionId = searchParams.get('competitionId')

    let whereClause: any = {}

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (competitionId) {
      whereClause.competitions = {
        some: {
          competitionId: competitionId
        }
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: [
        { eventNumber: 'asc' },
        { eventDate: 'asc' },
      ],
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
