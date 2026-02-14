import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const competitions = await prisma.competition.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(session?.user
            ? [{ users: { some: { userId: (session.user as any).id } } }]
            : []),
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, events: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Check which competitions the current user has joined
    const joinedCompIds = new Set<string>()
    if (session?.user) {
      const memberships = await prisma.competitionUser.findMany({
        where: { userId: (session.user as any).id },
        select: { competitionId: true },
      })
      memberships.forEach((m) => joinedCompIds.add(m.competitionId))
    }

    const result = competitions.map((comp) => ({
      ...comp,
      participantCount: comp._count.users,
      eventCount: comp._count.events,
      isJoined: joinedCompIds.has(comp.id),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitions' },
      { status: 500 }
    )
  }
}
