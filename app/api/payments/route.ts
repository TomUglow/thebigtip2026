import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

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

    if (!competitionId || !amount || amount <= 0) {
      return apiError('Invalid payment data', 400)
    }

    // TODO: Implement Stripe payment intent creation
    // 1. Create payment record with status 'pending'
    // 2. Call Stripe API to create payment intent
    // 3. Return clientSecret for frontend

    return apiError('Stripe integration coming soon', 501)
  } catch (error) {
    console.error('Error creating payment:', error)
    return apiError('Failed to create payment', 500)
  }
}

/**
 * Webhook for Stripe payment events
 * POST /api/payments/webhook
 */
export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement Stripe webhook handler
    // 1. Verify webhook signature
    // 2. Update payment status based on event
    // 3. Add user to competition on successful payment

    return apiError('Webhook not implemented', 501)
  } catch (error) {
    console.error('Error processing webhook:', error)
    return apiError('Webhook processing failed', 500)
  }
}
