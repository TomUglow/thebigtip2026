import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { competitionId } = params

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        owner: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, events: true },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    let isJoined = false
    if (session?.user) {
      const membership = await prisma.competitionUser.findUnique({
        where: {
          userId_competitionId: {
            userId: (session.user as any).id,
            competitionId,
          },
        },
      })
      isJoined = !!membership
    }

    return NextResponse.json({
      ...competition,
      participantCount: competition._count.users,
      eventCount: competition._count.events,
      isJoined,
    })
  } catch (error) {
    console.error('Error fetching competition:', error)
    return NextResponse.json({ error: 'Failed to fetch competition' }, { status: 500 })
  }
}
