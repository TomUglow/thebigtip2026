import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    // Mark profile as completed
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: true },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        profileCompleted: true,
      },
    })

    return apiSuccess(user)
  } catch (error) {
    console.error('Error completing profile:', error)
    return apiError('Internal server error', 500)
  }
}
