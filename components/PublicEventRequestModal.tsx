'use client'

import { useState } from 'react'
import { X, Globe, CheckCircle, ChevronDown } from 'lucide-react'

interface PublicEventRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

const SPORTS = ['AFL', 'NRL', 'Basketball', 'Soccer', 'Tennis', 'Cricket', 'Rugby Union', 'NHL', 'Other']

export default function PublicEventRequestModal({ isOpen, onClose }: PublicEventRequestModalProps) {
  const [sport, setSport] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [options, setOptions] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleClose = () => {
    setSport('')
    setEventTitle('')
    setEventDate('')
    setOptions('')
    setError('')
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!sport || !eventTitle.trim()) {
      setError('Sport and event title are required')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/event-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport,
          eventTitle: eventTitle.trim(),
          ...(eventDate && { eventDate }),
          ...(options.trim() && { options: options.trim() }),
        }),
      })
      if (!res.ok) {
        setError('Failed to submit request. Please try again.')
        return
      }
      setSuccess(true)
    } catch {
      setError('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold">Request New Event</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="font-semibold">Request submitted!</p>
            <p className="text-sm text-muted-foreground">
              Platform admins have been notified and will review your suggestion.
              Once approved, the event will be available for competitions.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 px-5 py-2 brand-gradient text-white text-sm font-semibold rounded-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Suggest a new event for the platform. Admins will review and add it if approved —
              it can then be added to competitions.
            </p>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <div className="relative">
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8"
              >
                <option value="">Select sport...</option>
                {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <input
              type="text"
              placeholder="Event title..."
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">
                Event start date <span className="italic">(optional)</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">
                Betting options <span className="italic">(optional, e.g. Team A, Team B, Draw)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Collingwood, Carlton"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 brand-gradient text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Submitting...' : 'Submit to Admins'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
