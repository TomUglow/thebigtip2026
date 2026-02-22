'use client'

import { useState } from 'react'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onComplete: () => void
}

export default function ProfileCompletionModal({ isOpen, onComplete }: ProfileCompletionModalProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (name.trim()) {
        const res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to update profile')
          return
        }
      }

      const completeRes = await fetch('/api/account/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (completeRes.ok) {
        onComplete()
      } else {
        setError('Failed to complete profile setup')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    try {
      const res = await fetch('/api/account/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) onComplete()
    } catch {
      console.error('Error completing profile')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Welcome to The Big Tip!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Add your name so other tippers know who you are
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2">
              Full Name <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 brand-gradient text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-red/40 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Let\'s go!'}
            </button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          You can update your details anytime in account settings
        </p>
      </div>
    </div>
  )
}
