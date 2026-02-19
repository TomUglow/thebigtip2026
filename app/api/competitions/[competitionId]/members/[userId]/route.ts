import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

type RouteParams = { params: { competitionId: string; userId: string } }

/** PATCH — promote or demote a member's role */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const callerId = requireAuth(session)
    if (callerId instanceof Response) return callerId

    const { competitionId, userId: targetUserId } = params
    const body = await request.json()
    const newRole: string = body.role

    if (newRole !== 'commissioner' && newRole !== 'member') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Caller must be a commissioner
    const callerMembership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId: callerId, competitionId } },
      select: { role: true },
    })
    if (!callerMembership || callerMembership.role !== 'commissioner') {
      return NextResponse.json({ error: 'Only commissioners can change roles' }, { status: 403 })
    }

    // If demoting, ensure there will still be at least one commissioner left
    if (newRole === 'member') {
      const commissionerCount = await prisma.competitionUser.count({
        where: { competitionId, role: 'commissioner' },
      })
      if (commissionerCount <= 1) {
        return NextResponse.json(
          { error: 'There must always be at least one commissioner' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.competitionUser.update({
      where: { userId_competitionId: { userId: targetUserId, competitionId } },
      data: { role: newRole },
      select: { userId: true, role: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

/** DELETE — remove a member from the competition (picks are preserved) */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const callerId = requireAuth(session)
    if (callerId instanceof Response) return callerId

    const { competitionId, userId: targetUserId } = params

    // Caller must be a commissioner
    const callerMembership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId: callerId, competitionId } },
      select: { role: true },
    })
    if (!callerMembership || callerMembership.role !== 'commissioner') {
      return NextResponse.json({ error: 'Only commissioners can remove members' }, { status: 403 })
    }

    // If the target is a commissioner, ensure at least one will remain
    const targetMembership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId: targetUserId, competitionId } },
      select: { role: true },
    })
    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    if (targetMembership.role === 'commissioner') {
      const commissionerCount = await prisma.competitionUser.count({
        where: { competitionId, role: 'commissioner' },
      })
      if (commissionerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last commissioner' },
          { status: 400 }
        )
      }
    }

    // Delete only the membership record — picks remain intact
    await prisma.competitionUser.delete({
      where: { userId_competitionId: { userId: targetUserId, competitionId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
