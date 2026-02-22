import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAdmin } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const optionRequests = await prisma.optionRequest.findMany({
      where: { status: 'pending' },
      include: {
        event: { select: { id: true, title: true, sport: true } },
        user: { select: { id: true, name: true, email: true } },
        competition: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return apiSuccess(optionRequests)
  } catch (error) {
    console.error('Admin option requests GET error:', error)
    return apiError('Failed to fetch option requests', 500)
  }
}
