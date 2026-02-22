import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { competitionId } = await request.json()

    if (!competitionId) {
      return NextResponse.json({ error: 'Competition ID required' }, { status: 400 })
    }

    // Verify competition exists and is joinable
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    if (competition.status !== 'active' && competition.status !== 'upcoming') {
      return NextResponse.json({ error: 'Competition is no longer accepting entries' }, { status: 400 })
    }

    // Private competitions require invite code — use /api/competitions/join-by-code instead
    if (!competition.isPublic) {
      return NextResponse.json(
        { error: 'Private competitions require an invite code. Please use the invite link or code to join.' },
        { status: 403 }
      )
    }

    // Paid competitions require payment before joining
    if (competition.entryFee > 0) {
      const existing = await prisma.competitionUser.findUnique({
        where: {
          userId_competitionId: { userId: session.user.id, competitionId },
        },
      })
      if (existing) {
        return NextResponse.json({ success: true, competitionId })
      }
      return NextResponse.json(
        {
          error: 'Payment required',
          requiresPayment: true,
          competitionId,
          amount: competition.entryFee,
          currency: 'AUD',
        },
        { status: 402 }
      )
    }

    // Create membership (upsert to handle duplicates gracefully)
    await prisma.competitionUser.upsert({
      where: {
        userId_competitionId: {
          userId: session.user.id,
          competitionId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        competitionId,
      },
    })

    return NextResponse.json({ success: true, competitionId })
  } catch (error) {
    console.error('Error joining competition:', error)
    return NextResponse.json({ error: 'Failed to join competition' }, { status: 500 })
  }
}
