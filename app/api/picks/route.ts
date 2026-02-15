import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')

    let whereClause: any = { userId: session.user.id }

    if (competitionId) {
      // Only return picks for events in this competition
      const competitionEvents = await prisma.competitionEvent.findMany({
        where: { competitionId },
        select: { eventId: true },
      })
      whereClause.eventId = { in: competitionEvents.map((ce) => ce.eventId) }
    }

    const picks = await prisma.pick.findMany({
      where: whereClause,
      select: {
        id: true,
        eventId: true,
        selectedTeam: true,
        isCorrect: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(picks)
  } catch (error) {
    console.error('Error fetching picks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch picks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, selectedTeam } = body

    // Check if pick already exists
    const existingPick = await prisma.pick.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    })

    let pick
    if (existingPick) {
      // Update existing pick
      pick = await prisma.pick.update({
        where: {
          id: existingPick.id
        },
        data: {
          selectedTeam: selectedTeam
        },
      })
    } else {
      // Create new pick
      pick = await prisma.pick.create({
        data: {
          userId: session.user.id,
          eventId: eventId,
          selectedTeam: selectedTeam
        },
      })
    }

    return NextResponse.json(pick)
  } catch (error) {
    console.error('Error creating/updating pick:', error)
    return NextResponse.json(
      { error: 'Failed to save pick' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pickId = searchParams.get('id')

    if (!pickId) {
      return NextResponse.json({ error: 'Pick ID required' }, { status: 400 })
    }

    await prisma.pick.delete({
      where: {
        id: pickId,
        userId: session.user.id // Ensure user owns the pick
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pick:', error)
    return NextResponse.json(
      { error: 'Failed to delete pick' },
      { status: 500 }
    )
  }
}
