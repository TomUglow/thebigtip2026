import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTOTPSecret, getTOTPUri, getTOTPQRCode } from '@/lib/mfa'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    })

    if (!user) return apiError('User not found', 404)
    if (user.mfaEnabled) return apiError('MFA is already enabled', 400)

    const secret = generateTOTPSecret()
    const uri = getTOTPUri(secret, user.email)
    const qrCode = await getTOTPQRCode(uri)

    // Save the secret (pending — not yet enabled until user verifies)
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    })

    return apiSuccess({ qrCode, secret })
  } catch (error) {
    console.error('Error setting up MFA:', error)
    return apiError('Internal server error', 500)
  }
}
