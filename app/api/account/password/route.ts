import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { passwordSchema } from '@/lib/validations'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()

    // Validate input
    const result = passwordSchema.safeParse(body)
    if (!result.success) {
      console.error('Password validation error:', result.error.errors)
      return apiError('Invalid input', 400)
    }

    const data = result.data

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(data.currentPassword, user.password)

    if (!isPasswordCorrect) {
      return apiError('Current password is incorrect', 401)
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return apiSuccess({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return apiError('Internal server error', 500)
  }
}
