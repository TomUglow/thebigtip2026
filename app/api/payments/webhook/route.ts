import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    const secret = process.env.STRIPE_WEBHOOK_SECRET

    if (!signature || !secret) {
      console.error('Webhook missing signature or secret')
      return new Response('Webhook configuration error', { status: 500 })
    }

    const stripe = getStripe()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', message)
      return new Response(`Webhook Error: ${message}`, { status: 400 })
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { paymentId, userId, competitionId } = paymentIntent.metadata || {}

        if (!paymentId || !userId || !competitionId) {
          console.error('Webhook: missing metadata in payment_intent.succeeded', paymentIntent.id)
          return new Response('OK', { status: 200 })
        }

        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: { status: 'succeeded' },
          })
          await tx.competitionUser.upsert({
            where: {
              userId_competitionId: { userId, competitionId },
            },
            update: {},
            create: { userId, competitionId },
          })
        })
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { paymentId } = paymentIntent.metadata || {}

        if (paymentId) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'failed' },
          })
        }
        break
      }

      default:
        // Unhandled event type
        break
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
}
