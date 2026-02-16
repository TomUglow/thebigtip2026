import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    // Delete team (ensure it belongs to the user)
    const team = await prisma.favoriteTeam.findUnique({
      where: { id: params.id },
    })

    if (!team || team.userId !== userId) {
      return apiError('Team not found', 404)
    }

    await prisma.favoriteTeam.delete({
      where: { id: params.id },
    })

    return apiSuccess({ message: 'Team removed' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return apiError('Internal server error', 500)
  }
}
