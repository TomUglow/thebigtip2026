import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications - List user's notifications
 * POST /api/notifications - Mark notification as read
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const typeFilter = searchParams.get('type')

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
        ...(typeFilter && { type: typeFilter }),
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        data: true,
        read: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return apiSuccess({ data: notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return apiError('Failed to fetch notifications', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()
    const { notificationId, read } = body

    if (!notificationId) {
      return apiError('Notification ID required', 400)
    }

    // Update notification read status
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { read: read !== undefined ? read : true },
    })

    if (notification.count === 0) {
      return apiError('Notification not found', 404)
    }

    return apiSuccess({ success: true, message: 'Notification updated' })
  } catch (error) {
    console.error('Error updating notification:', error)
    return apiError('Failed to update notification', 500)
  }
}

/**
 * DELETE /api/notifications?id=... - Delete a notification
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return apiError('Notification ID required', 400)
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    })

    return apiSuccess({ success: true, message: 'Notification deleted' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return apiError('Failed to delete notification', 500)
  }
}
