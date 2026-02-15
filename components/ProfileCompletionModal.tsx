'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onComplete: () => void
}

export default function ProfileCompletionModal({ isOpen, onComplete }: ProfileCompletionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    postcode: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Update profile with entered data
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || undefined,
          mobile: formData.mobile || undefined,
          postcode: formData.postcode || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update profile')
        return
      }

      // Mark profile as completed
      const completeRes = await fetch('/api/account/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (completeRes.ok) {
        onComplete()
      } else {
        setError('Failed to complete profile setup')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    try {
      // Mark profile as completed without filling in data
      const res = await fetch('/api/account/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        onComplete()
      }
    } catch (err) {
      console.error('Error completing profile:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Help us get to know you better (optional)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
            />
          </div>

          {/* Mobile */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-semibold mb-2">
              Mobile Number
            </label>
            <input
              id="mobile"
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
            />
          </div>

          {/* Postcode */}
          <div>
            <label htmlFor="postcode" className="block text-sm font-semibold mb-2">
              Postcode
            </label>
            <input
              id="postcode"
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              placeholder="e.g., 2000"
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
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
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          You can update these later in your account settings
        </p>
      </div>
    </div>
  )
}
