import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  correctedOption: z.string().min(1).max(200).transform((s) => s.trim()).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const { requestId } = params
    const body = await request.json()
    const result = actionSchema.safeParse(body)
    if (!result.success) {
      return apiError('Invalid action data', 400)
    }

    const { action, correctedOption } = result.data

    const optionRequest = await prisma.optionRequest.findUnique({
      where: { id: requestId },
      include: {
        event: { select: { id: true, title: true, options: true } },
        user: { select: { id: true, name: true } },
      },
    })

    if (!optionRequest) {
      return apiError('Option request not found', 404)
    }
    if (optionRequest.status !== 'pending') {
      return apiError('This request has already been resolved', 400)
    }

    const now = new Date()

    if (action === 'approve') {
      const approvedOption = correctedOption ?? optionRequest.suggestedOption

      // Append option to event options (deduplicated)
      const currentOptions = Array.isArray(optionRequest.event.options)
        ? (optionRequest.event.options as string[])
        : []
      const updatedOptions = currentOptions.includes(approvedOption)
        ? currentOptions
        : [...currentOptions, approvedOption]

      await prisma.$transaction(async (tx) => {
        // Update event options
        await tx.event.update({
          where: { id: optionRequest.eventId },
          data: { options: updatedOptions },
        })

        // Update the pick: confirm it with the approved option
        await tx.pick.updateMany({
          where: {
            userId: optionRequest.userId,
            eventId: optionRequest.eventId,
            competitionId: optionRequest.competitionId,
          },
          data: {
            selectedTeam: approvedOption,
            isPending: false,
          },
        })

        // Mark the option request as approved
        await tx.optionRequest.update({
          where: { id: requestId },
          data: { status: 'approved', resolvedBy: adminId as string, resolvedAt: now },
        })

        // Notify the user
        await tx.notification.create({
          data: {
            userId: optionRequest.userId,
            type: 'option_request_approved',
            title: 'Pick option approved',
            message: `Your suggested option "${approvedOption}" for "${optionRequest.event.title ?? 'the event'}" has been approved and added.`,
          },
        })
      })

      return apiSuccess({ status: 'approved', approvedOption })
    } else {
      // Reject
      await prisma.$transaction(async (tx) => {
        // Delete the pending pick
        await tx.pick.deleteMany({
          where: {
            userId: optionRequest.userId,
            eventId: optionRequest.eventId,
            competitionId: optionRequest.competitionId,
            isPending: true,
          },
        })

        // Mark the option request as rejected
        await tx.optionRequest.update({
          where: { id: requestId },
          data: { status: 'rejected', resolvedBy: adminId as string, resolvedAt: now },
        })

        // Notify the user
        await tx.notification.create({
          data: {
            userId: optionRequest.userId,
            type: 'option_request_rejected',
            title: 'Pick option not approved',
            message: `Your suggested option "${optionRequest.suggestedOption}" for "${optionRequest.event.title ?? 'the event'}" was not approved. Please select from the available options.`,
          },
        })
      })

      return apiSuccess({ status: 'rejected' })
    }
  } catch (error) {
    console.error('Admin option request PATCH error:', error)
    return apiError('Failed to process option request', 500)
  }
}
