import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    })

    if (!user) return apiError('User not found', 404)

    return apiSuccess({ mfaEnabled: user.mfaEnabled })
  } catch (error) {
    console.error('Error fetching MFA status:', error)
    return apiError('Internal server error', 500)
  }
}
