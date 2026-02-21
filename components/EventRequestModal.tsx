'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { X, Search, Loader2, CheckCircle } from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'

interface AvailableEvent {
  id: string
  title: string | null
  sport: string
  eventDate: string
  team1Name: string | null
  team2Name: string | null
}

interface EventRequestModalProps {
  competitionId: string
  isOpen: boolean
  onClose: () => void
}

export default function EventRequestModal({ competitionId, isOpen, onClose }: EventRequestModalProps) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [eventSportFilter, setEventSportFilter] = useState('All')

  const fetchAvailableEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const res = await fetch(`/api/competitions/${competitionId}/available-events`)
      if (!res.ok) return
      const data = await res.json()
      setAvailableEvents(data.events ?? [])
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false)
    }
  }, [competitionId])

  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess(false)
      setSelectedEventId('')
      setEventSearch('')
      setEventSportFilter('All')
      fetchAvailableEvents()
    }
  }, [isOpen, fetchAvailableEvents])

  const sportColor = (sport: string) => SPORT_COLORS[sport] ?? SPORT_COLORS['Multi-sport'] ?? '#666'

  const uniqueSports = Array.from(new Set(availableEvents.map((e) => e.sport))).sort()

  const filteredEvents = availableEvents.filter((e) => {
    const matchesSport = eventSportFilter === 'All' || e.sport === eventSportFilter
    const q = eventSearch.toLowerCase()
    const label = e.title ?? `${e.team1Name ?? ''} vs ${e.team2Name ?? ''}`
    return matchesSport && (!q || label.toLowerCase().includes(q) || e.sport.toLowerCase().includes(q))
  })

  const handleSubmit = async () => {
    if (!selectedEventId) {
      setError('Please select an event')
      return
    }
    const event = availableEvents.find((e) => e.id === selectedEventId)
    if (!event) return

    setSubmitting(true)
    setError('')
    const eventTitle = event.title ?? `${event.team1Name ?? '?'} vs ${event.team2Name ?? '?'}`
    try {
      const res = await fetch(`/api/competitions/${competitionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event_request',
          content: `Requesting to add: ${eventTitle} (${event.sport})`,
          requestMeta: {
            eventId: event.id,
            eventTitle,
            sport: event.sport,
            eventDate: event.eventDate,
          },
        }),
      })
      if (!res.ok) {
        setError('Failed to submit request')
        return
      }
      setSuccess(true)
    } catch {
      setError('Failed to submit request')
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
          <h2 className="text-base font-bold">Request Event</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
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
              Your request has been sent to the commissioner for review.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 brand-gradient text-white text-sm font-semibold rounded-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a platform event to request it be added to this competition.
              The commissioner will review and approve or reject.
            </p>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            {/* Sport filter pills */}
            {uniqueSports.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {['All', ...uniqueSports].map((s) => (
                  <button
                    key={s}
                    onClick={() => setEventSportFilter(s)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      eventSportFilter === s
                        ? 'brand-gradient text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search events..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Event list */}
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-background">
              {loadingEvents ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {availableEvents.length === 0 ? 'No events available to add' : 'No events match your search'}
                </p>
              ) : (
                filteredEvents.map((ev) => {
                  const label = ev.title ?? `${ev.team1Name ?? '?'} vs ${ev.team2Name ?? '?'}`
                  const color = sportColor(ev.sport)
                  return (
                    <label
                      key={ev.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${
                        selectedEventId === ev.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="availableEvent"
                        value={ev.id}
                        checked={selectedEventId === ev.id}
                        onChange={() => setSelectedEventId(ev.id)}
                        className="accent-primary flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-white mr-1.5"
                            style={{ backgroundColor: color, fontSize: '10px' }}
                          >
                            {ev.sport}
                          </span>
                          {format(new Date(ev.eventDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedEventId || submitting}
              className="w-full py-2.5 brand-gradient text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Submitting...' : 'Request to Commissioner'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
