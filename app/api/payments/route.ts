import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key)
}

/**
 * GET /api/payments - List user's payments
 * POST /api/payments - Create payment intent for competition entry
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const payments = await prisma.payment.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        competitionId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return apiError('Failed to fetch payments', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()
    const { competitionId, amount } = body

    if (!competitionId || typeof amount !== 'number' || amount <= 0) {
      return apiError('Invalid payment data', 400)
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    })
    if (!competition) {
      return apiError('Competition not found', 404)
    }
    if (competition.entryFee !== amount) {
      return apiError('Amount does not match competition entry fee', 400)
    }
    if (competition.status !== 'active' && competition.status !== 'upcoming') {
      return apiError('Competition is not accepting entries', 400)
    }

    const existingMember = await prisma.competitionUser.findUnique({
      where: {
        userId_competitionId: { userId, competitionId },
      },
    })
    if (existingMember) {
      return apiError('You are already a member of this competition', 409)
    }

    const stripe = getStripe()
    const amountCents = Math.round(amount * 100)

    const payment = await prisma.payment.create({
      data: {
        userId,
        competitionId,
        amount,
        currency: 'AUD',
        status: 'pending',
      },
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'aud',
      metadata: {
        paymentId: payment.id,
        userId,
        competitionId,
      },
      automatic_payment_methods: { enabled: true },
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripePaymentId: paymentIntent.id },
    })

    return apiSuccess({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('STRIPE_SECRET_KEY')) {
      return apiError('Payment system is not configured', 503)
    }
    console.error('Error creating payment:', error)
    return apiError('Failed to create payment', 500)
  }
}
