'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Target, Check, Filter } from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type {Event, Competition} from '@/lib/types'
import MainEventCard from '@/components/MainEventCard'

export default function CreateLeaguePage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [events, setEvents] = useState<Event[]>([])
  const [sportFilter, setSportFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events')
        const data = await res.json()
        if (Array.isArray(data)) {
          setEvents(data.filter((e: Event) => e.status !== 'completed'))
        }
      } catch (err) {
        console.error('Error fetching events:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const uniqueSports = ['All', ...Array.from(new Set(events.map((e) => e.sport))).sort()]

  const filteredEvents = events
    .filter((e) => sportFilter === 'All' || e.sport === sportFilter)
    .filter((e) => !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()))

  const allFilteredSelected =
    filteredEvents.length > 0 && filteredEvents.every((e) => selectedEventIds.has(e.id))

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredEvents.forEach((e) => next.delete(e.id))
      } else {
        filteredEvents.forEach((e) => next.add(e.id))
      }
      return next
    })
  }

  const canSubmit = name.trim().length > 0 && selectedEventIds.size > 0 && startDate && !submitting

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: new Date(startDate).toISOString(),
          eventIds: Array.from(selectedEventIds),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create league')
        return
      }

      const data = await res.json()
      router.push(`/lobby/${data.competitionId}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Min date for the datetime-local input (now, formatted for input)
  const minDate = new Date().toISOString().slice(0, 16)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/lobby"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lobby
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight font-display">Create Private League</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up a competition for you and your mates.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <MainEventCard />
      </div>

      {/* Competition details form */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">League Name</label>
          <input
            type="text"
            placeholder="e.g. Office Tipping Comp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Tips Close Date</label>
          <p className="text-xs text-muted-foreground mb-1.5">
            Tips will be locked after this date.
          </p>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={minDate}
            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Custom Rules / Description
          </label>
          <textarea
            placeholder="Optional: describe your custom rules, bragging rights, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Event selection */}
      <div className="space-y-4">
        {/* Header with count and select all */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 gold-accent" />
            <h2 className="text-lg font-bold uppercase tracking-wider font-display">
              Select Events
            </h2>
            <span className="text-sm text-muted-foreground">
              ({selectedEventIds.size} selected)
            </span>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-xs text-primary hover:underline font-semibold"
          >
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Sport filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {uniqueSports.map((sport) => {
            const sportColor =
              sport === 'All' ? '#D32F2F' : SPORT_COLORS[sport] || '#D32F2F'
            const isActive = sportFilter === sport
            return (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-foreground/70 hover:text-foreground bg-muted/50 border border-border'
                }`}
                style={isActive ? { backgroundColor: sportColor } : undefined}
              >
                {sport}
              </button>
            )
          })}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Event list */}
        <div className="glass-card rounded-xl overflow-hidden">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, idx) => {
              const isSelected = selectedEventIds.has(event.id)
              const sportColor = SPORT_COLORS[event.sport] || '#D32F2F'
              const isLast = idx === filteredEvents.length - 1

              return (
                <div
                  key={event.id}
                  onClick={() => toggleEvent(event.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    !isLast ? 'border-b border-border' : ''
                  } ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Sport badge */}
                  <span
                    className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0 min-w-[80px] text-center"
                    style={{ backgroundColor: `${sportColor}20`, color: sportColor }}
                  >
                    {event.sport}
                  </span>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{event.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {format(new Date(event.eventDate), 'd MMM yyyy')}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No events found{searchQuery && ` matching "${searchQuery}"`}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          {selectedEventIds.size === 0
            ? 'Select at least one event'
            : `${selectedEventIds.size} event${selectedEventIds.size !== 1 ? 's' : ''} selected`}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="brand-gradient text-white text-sm font-bold px-6 py-2.5 rounded-lg hover-elevate disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating...' : 'Create League'}
        </button>
      </div>
    </div>
  )
}
