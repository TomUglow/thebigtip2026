import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTOTP } from '@/lib/mfa'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()
    const { totp } = body

    if (!totp || typeof totp !== 'string') {
      return apiError('Authenticator code is required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    })

    if (!user) return apiError('User not found', 404)
    if (user.mfaEnabled) return apiError('MFA is already enabled', 400)
    if (!user.mfaSecret) return apiError('MFA setup not started. Please generate a QR code first.', 400)

    if (!verifyTOTP(user.mfaSecret, totp)) {
      return apiError('Invalid authenticator code', 400)
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    })

    return apiSuccess({ message: 'Two-factor authentication enabled' })
  } catch (error) {
    console.error('Error enabling MFA:', error)
    return apiError('Internal server error', 500)
  }
}
