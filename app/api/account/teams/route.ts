import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const teamSchema = z.object({
  sport: z.string().min(1),
  team: z.string().min(1),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teams = await prisma.favoriteTeam.findMany({
      where: {
        user: { email: session.user.email.toLowerCase() },
      },
      select: {
        id: true,
        sport: true,
        team: true,
      },
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = teamSchema.parse(body)

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create favorite team
    await prisma.favoriteTeam.create({
      data: {
        userId: user.id,
        sport: data.sport,
        team: data.team,
      },
    })

    // Return all teams
    const teams = await prisma.favoriteTeam.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        sport: true,
        team: true,
      },
    })

    return NextResponse.json({ teams })
  } catch (error: any) {
    console.error('Error adding team:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This team is already in your favorites' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
