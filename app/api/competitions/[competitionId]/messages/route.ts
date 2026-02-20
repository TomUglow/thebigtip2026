import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { messageCreateSchema } from '@/lib/validations'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * Get messages for a competition's group chat
 * GET /api/competitions/[competitionId]/messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { competitionId } = params

    // Verify user is a member of this competition
    const membership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
      select: { role: true },
    })
    if (!membership) return apiError('Not a member of this competition', 403)

    const messages = await prisma.message.findMany({
      where: { competitionId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return apiSuccess({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return apiError('Failed to fetch messages', 500)
  }
}

/**
 * Post a message to a competition's group chat
 * POST /api/competitions/[competitionId]/messages
 * Body: { type: "chat" | "event_request", content: string, requestMeta?: {...} }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { competitionId } = params

    // Verify user is a member of this competition
    const membership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
      select: { role: true },
    })
    if (!membership) return apiError('Not a member of this competition', 403)

    const body = await request.json()
    const result = messageCreateSchema.safeParse(body)
    if (!result.success) {
      console.error('Message validation error:', result.error.errors)
      return apiError('Invalid message data', 400)
    }

    const { type, content, requestMeta } = result.data

    const message = await prisma.message.create({
      data: {
        competitionId,
        userId,
        type,
        content,
        requestMeta: type === 'event_request' ? requestMeta : undefined,
        status: type === 'event_request' ? 'pending' : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return apiSuccess(message, 201)
  } catch (error) {
    console.error('Error posting message:', error)
    return apiError('Failed to post message', 500)
  }
}
