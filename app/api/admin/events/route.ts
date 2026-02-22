import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createEventSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  title: z.string().min(1, 'Title is required'),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required'),
  eventDate: z.string().min(1, 'Event date is required'),
  team1Name: z.string().optional(),
  team1Abbr: z.string().optional(),
  team1Odds: z.string().optional(),
  team2Name: z.string().optional(),
  team2Abbr: z.string().optional(),
  team2Odds: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const events = await prisma.event.findMany({
      orderBy: [{ eventNumber: 'asc' }, { eventDate: 'asc' }],
      select: {
        id: true,
        eventNumber: true,
        title: true,
        sport: true,
        options: true,
        allowOptionRequests: true,
        eventDate: true,
        status: true,
        winner: true,
        score: true,
        _count: { select: { picks: true, competitions: true } },
      },
    })

    return apiSuccess(events)
  } catch (error) {
    console.error('Admin events GET error:', error)
    return apiError('Failed to fetch events', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const adminId = requireAdmin(session)
    if (adminId instanceof Response) return adminId

    const body = await request.json()
    const result = createEventSchema.safeParse(body)
    if (!result.success) {
      return apiError('Invalid event data', 400)
    }

    const {
      sport, title, options, eventDate,
      team1Name, team1Abbr, team1Odds,
      team2Name, team2Abbr, team2Odds,
    } = result.data

    const parsedDate = new Date(eventDate)
    if (isNaN(parsedDate.getTime())) {
      return apiError('Invalid event date', 400)
    }

    const publicComps = await prisma.competition.findMany({
      where: { isPublic: true },
      select: { id: true },
    })

    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          sport,
          title,
          options,
          eventDate: parsedDate,
          status: 'upcoming',
          team1Name: team1Name || null,
          team1Abbr: team1Abbr || null,
          team1Odds: team1Odds || null,
          team2Name: team2Name || null,
          team2Abbr: team2Abbr || null,
          team2Odds: team2Odds || null,
        },
      })

      if (publicComps.length > 0) {
        await tx.competitionEvent.createMany({
          data: publicComps.map((comp) => ({
            competitionId: comp.id,
            eventId: newEvent.id,
          })),
          skipDuplicates: true,
        })
      }

      return newEvent
    })

    return apiSuccess({ success: true, event }, 201)
  } catch (error) {
    console.error('Admin events POST error:', error)
    return apiError('Failed to create event', 500)
  }
}
