import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const statusFilter = searchParams.get('status')

    const membership = await prisma.competitionUser.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
      select: { role: true },
    })
    if (!membership) return apiError('Not a member of this competition', 403)

    const messages = await prisma.message.findMany({
      where: {
        competitionId,
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
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
 *
 * type "chat"                   — regular message
 * type "event_request"          — request to add existing platform event to competition
 * type "platform_event_request" — suggest brand-new event to platform admins (creates admin notifications)
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requestMeta: (type !== 'chat' ? requestMeta : undefined) as any,
        status: type === 'event_request' ? 'pending' : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    // For platform event requests: notify all admin users
    if (type === 'platform_event_request') {
      const meta = requestMeta as Record<string, unknown>
      const senderName = message.user.name ?? 'A user'
      const eventTitle = (meta?.eventTitle as string) ?? 'a new event'
      const sport = (meta?.sport as string) ?? ''

      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      })

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'platform_event_request',
            title: 'New Event Suggestion',
            message: `${senderName} suggested a new event: ${eventTitle}${sport ? ` (${sport})` : ''}`,
            data: { competitionId, messageId: message.id, requestMeta: meta as unknown as Prisma.InputJsonValue },
          })),
        })
      }
    }

    return apiSuccess(message, 201)
  } catch (error) {
    console.error('Error posting message:', error)
    return apiError('Failed to post message', 500)
  }
}
