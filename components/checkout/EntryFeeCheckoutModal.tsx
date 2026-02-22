'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { X } from 'lucide-react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface EntryFeeCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  competitionId: string
  competitionName: string
  amount: number
}

function CheckoutForm({
  clientSecret,
  amount,
  competitionName,
  onSuccess,
  onClose,
}: {
  clientSecret: string
  amount: number
  competitionName: string
  onSuccess: () => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setError(null)
    setProcessing(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Payment form not ready')
      setProcessing(false)
      return
    }

    const { error: submitError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
      return
    }

    setProcessing(false)
    onSuccess()
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1a1a1a',
        '::placeholder': { color: '#888' },
      },
      invalid: {
        color: '#d32f2f',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pay ${amount.toFixed(0)} to enter <strong>{competitionName}</strong>
      </p>

      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="brand-gradient text-white text-sm font-bold px-5 py-2 rounded-lg hover-elevate disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(0)}`}
        </button>
      </div>
    </form>
  )
}

export default function EntryFeeCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  competitionId,
  competitionName,
  amount,
}: EntryFeeCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !stripePromise) return

    setClientSecret(null)
    setError(null)
    setLoading(true)

    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitionId, amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error || 'Failed to create payment')
          return
        }
        setClientSecret(data.clientSecret)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to start checkout')
      })
      .finally(() => setLoading(false))
  }, [isOpen, competitionId, amount])

  if (!isOpen) return null

  if (!stripePromise) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full">
          <p className="text-red-500">Payment system is not configured.</p>
          <button onClick={onClose} className="mt-4 text-sm text-primary hover:underline">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-2">Enter Competition</h2>
        <p className="text-sm text-muted-foreground mb-6">Secure payment powered by Stripe</p>

        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            <div className="animate-pulse">Loading checkout...</div>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
            <button
              onClick={onClose}
              className="text-sm text-primary hover:underline"
            >
              Close
            </button>
          </div>
        )}

        {clientSecret && !loading && !error && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <CheckoutForm
              clientSecret={clientSecret}
              amount={amount}
              competitionName={competitionName}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  )
}
