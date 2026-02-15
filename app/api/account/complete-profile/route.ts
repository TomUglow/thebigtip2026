import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark profile as completed
    const user = await prisma.user.update({
      where: { email: session.user.email.toLowerCase() },
      data: { profileCompleted: true },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        profileCompleted: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error completing profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
