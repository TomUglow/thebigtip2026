import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const data = passwordSchema.parse(body)

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(data.currentPassword, user.password)

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { email: session.user.email.toLowerCase() },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error: any) {
    console.error('Error changing password:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
