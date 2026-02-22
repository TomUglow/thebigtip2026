import { getServerSession } from 'next-auth'
import { randomBytes } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(
    randomBytes(8),
    (b: number) => chars[b % chars.length]
  ).join('')
}

const createCompSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Tips close date is required'),
  eventIds: z.array(z.string()).min(1, 'At least one event must be selected'),
  entryFee: z.coerce.number().min(0).optional().default(0),
  prizePool: z.coerce.number().min(0).optional().default(0),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const competitions = await prisma.competition.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true, events: true } },
      },
    })

    return apiSuccess(competitions)
  } catch (error) {
    console.error('Admin competitions GET error:', error)
    return apiError('Failed to fetch competitions', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const body = await request.json()
    const result = createCompSchema.safeParse(body)
    if (!result.success) {
      return apiError('Invalid competition data', 400)
    }

    const { name, description, startDate, eventIds, entryFee = 0, prizePool = 0 } = result.data

    // Verify all selected events exist
    const validEvents = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, eventDate: true },
      orderBy: { eventDate: 'desc' },
    })

    if (validEvents.length !== eventIds.length) {
      return apiError('Some selected events are invalid', 400)
    }

    const parsedStartDate = new Date(startDate)
    if (isNaN(parsedStartDate.getTime())) {
      return apiError('Invalid tips close date', 400)
    }

    // endDate = latest event date
    const endDate = validEvents[0].eventDate

    const competition = await prisma.$transaction(async (tx) => {
      const comp = await tx.competition.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          entryFee,
          prizePool,
          startDate: parsedStartDate,
          endDate,
          isPublic: true,
          inviteCode: generateInviteCode(),
          maxEvents: eventIds.length,
          status: 'upcoming',
          ownerId: adminId,
        },
      })

      await tx.competitionEvent.createMany({
        data: eventIds.map((eventId) => ({ competitionId: comp.id, eventId })),
      })

      await tx.competitionUser.create({
        data: { userId: adminId, competitionId: comp.id, role: 'commissioner' },
      })

      return comp
    })

    return apiSuccess({ success: true, competitionId: competition.id }, 201)
  } catch (error) {
    console.error('Admin competitions POST error:', error)
    return apiError('Failed to create competition', 500)
  }
}
