import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { teamSchema } from '@/lib/validations'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const teams = await prisma.favoriteTeam.findMany({
      where: { userId },
      select: {
        id: true,
        sport: true,
        team: true,
      },
    })

    return apiSuccess({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return apiError('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()

    // Validate input
    const result = teamSchema.safeParse(body)
    if (!result.success) {
      console.error('Team validation error:', result.error.errors)
      return apiError('Invalid input', 400)
    }

    const data = result.data

    // Create favorite team
    await prisma.favoriteTeam.create({
      data: {
        userId,
        sport: data.sport,
        team: data.team,
      },
    })

    // Return all teams
    const teams = await prisma.favoriteTeam.findMany({
      where: { userId },
      select: {
        id: true,
        sport: true,
        team: true,
      },
    })

    return apiSuccess({ teams }, 201)
  } catch (error: any) {
    console.error('Error adding team:', error)
    if (error.code === 'P2002') {
      return apiError('This team is already in your favorites', 409)
    }
    return apiError('Internal server error', 500)
  }
}
