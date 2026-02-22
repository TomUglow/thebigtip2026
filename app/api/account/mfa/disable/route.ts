import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return apiError('Password is required to disable MFA', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    })

    if (!user) return apiError('User not found', 404)
    if (!user.mfaEnabled) return apiError('MFA is not enabled', 400)

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return apiError('Incorrect password', 401)
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    })

    return apiSuccess({ message: 'Two-factor authentication disabled' })
  } catch (error) {
    console.error('Error disabling MFA:', error)
    return apiError('Internal server error', 500)
  }
}
