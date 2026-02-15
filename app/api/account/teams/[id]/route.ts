import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete team (ensure it belongs to the user)
    const team = await prisma.favoriteTeam.findUnique({
      where: { id: params.id },
    })

    if (!team || team.userId !== user.id) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await prisma.favoriteTeam.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Team removed' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
