'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format } from 'date-fns'
import {
  MessageSquare, X, Send, Plus, CheckCircle, XCircle, Clock,
  ChevronDown, Search, Loader2, Globe,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ChatMessage } from '@/lib/types'

interface CompetitionChatProps {
  competitionId: string
  competitionName: string
  currentUserId: string
  currentUserIsCommissioner: boolean
}

interface AvailableEvent {
  id: string
  title: string | null
  sport: string
  eventDate: string
  team1Name: string | null
  team2Name: string | null
}

const SPORTS = ['AFL', 'NRL', 'Basketball', 'Soccer', 'Tennis', 'Cricket', 'Rugby Union', 'NHL', 'Other']
// Poll every 5s when panel open, 30s when closed
const POLL_OPEN_MS = 5_000
const POLL_CLOSED_MS = 30_000

export default function CompetitionChat({
  competitionId,
  competitionName,
  currentUserId,
  currentUserIsCommissioner,
}: CompetitionChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestTab, setRequestTab] = useState<'existing' | 'new'>('existing')
  const [requestError, setRequestError] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // "Add existing event" tab state
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [eventSportFilter, setEventSportFilter] = useState('All')

  // "Suggest new event" tab state
  const [newEventForm, setNewEventForm] = useState({
    sport: '', eventTitle: '', eventDate: '', options: '',
  })

  // Commissioner action state
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  // Unread / notification state
  const [unreadCount, setUnreadCount] = useState(0)
  const lastSeenCountRef = useRef(0)
  const isFirstFetchRef = useRef(true)
  const [popupNotif, setPopupNotif] = useState<{ from: string; preview: string } | null>(null)
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/competitions/${competitionId}/messages`)
      if (!res.ok) return
      const data = await res.json()
      const fetched: ChatMessage[] = data.messages ?? []
      setMessages(fetched)

      if (isFirstFetchRef.current) {
        // On first load, mark all existing messages as already seen — no notifications
        lastSeenCountRef.current = fetched.length
        isFirstFetchRef.current = false
      } else if (!isOpen) {
        // On subsequent polls while panel is closed, show notifications for new messages
        const newCount = fetched.length - lastSeenCountRef.current
        if (newCount > 0) {
          setUnreadCount(newCount)
          const latestNew = fetched
            .slice(lastSeenCountRef.current)
            .reverse()
            .find((m) => m.userId !== currentUserId)
          if (latestNew) {
            const from = latestNew.user.name ?? 'Someone'
            const preview =
              latestNew.type === 'event_request'
                ? `Requesting to add: ${latestNew.requestMeta?.eventTitle ?? 'an event'}`
                : latestNew.type === 'platform_event_request'
                ? `Suggested new event: ${latestNew.requestMeta?.eventTitle ?? 'new event'}`
                : latestNew.content.length > 60
                ? latestNew.content.slice(0, 60) + '…'
                : latestNew.content
            setPopupNotif({ from, preview })
            if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
            popupTimerRef.current = setTimeout(() => setPopupNotif(null), 4000)
          }
        }
      }
    } catch {
      // Silently ignore poll errors
    } finally {
      if (!silent) setLoading(false)
    }
  }, [competitionId, isOpen, currentUserId])

  // Polling — faster when panel is open
  useEffect(() => {
    fetchMessages()
    const interval = isOpen ? POLL_OPEN_MS : POLL_CLOSED_MS
    pollRef.current = setInterval(() => fetchMessages(true), interval)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
    }
  }, [fetchMessages])

  // Scroll to bottom when messages update and panel is open
  useEffect(() => {
    if (isOpen && messages.length > 0) scrollToBottom()
  }, [messages.length, isOpen, scrollToBottom])

  // When panel opens: mark all messages as seen, clear notifications
  useEffect(() => {
    if (isOpen) {
      lastSeenCountRef.current = messages.length
      setUnreadCount(0)
      setPopupNotif(null)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
      setTimeout(scrollToBottom, 100)
      textareaRef.current?.focus()
    }
  }, [isOpen, messages.length, scrollToBottom])

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

  const openRequestForm = () => {
    setShowRequestForm(true)
    setRequestTab('existing')
    setRequestError('')
    setSelectedEventId('')
    setEventSearch('')
    setEventSportFilter('All')
    setNewEventForm({ sport: '', eventTitle: '', eventDate: '', options: '' })
    fetchAvailableEvents()
  }

  const closeRequestForm = () => {
    setShowRequestForm(false)
    setRequestError('')
  }

  const handleSend = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || sending) return

    setSending(true)
    setError('')

    const optimistic: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      competitionId,
      userId: currentUserId,
      type: 'chat',
      content: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: currentUserId, name: 'You', avatar: null },
    }
    setMessages((prev) => [...prev, optimistic])
    setNewMessage('')

    try {
      const res = await fetch(`/api/competitions/${competitionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', content: trimmed }),
      })
      if (!res.ok) {
        setError('Failed to send message')
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        setNewMessage(trimmed)
        return
      }
      await fetchMessages(true)
    } catch {
      setError('Failed to send message')
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setNewMessage(trimmed)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Submit request to add an existing platform event to this competition
  const handleSubmitExistingRequest = async () => {
    if (!selectedEventId) {
      setRequestError('Please select an event')
      return
    }
    const event = availableEvents.find((e) => e.id === selectedEventId)
    if (!event) return

    setSubmittingRequest(true)
    setRequestError('')

    const eventTitle = event.title ?? `${event.team1Name ?? '?'} vs ${event.team2Name ?? '?'}`
    const content = `Requesting to add: ${eventTitle} (${event.sport})`
    try {
      const res = await fetch(`/api/competitions/${competitionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event_request',
          content,
          requestMeta: {
            eventId: event.id,
            eventTitle,
            sport: event.sport,
            eventDate: event.eventDate,
          },
        }),
      })
      if (!res.ok) {
        setRequestError('Failed to submit request')
        return
      }
      closeRequestForm()
      await fetchMessages(true)
    } catch {
      setRequestError('Failed to submit request')
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Submit a suggestion for a brand-new event to platform admins
  const handleSubmitNewEventRequest = async () => {
    const { sport, eventTitle, eventDate, options } = newEventForm
    if (!sport || !eventTitle || !eventDate || !options.trim()) {
      setRequestError('All fields are required')
      return
    }
    const optionsList = options.split(',').map((o) => o.trim()).filter(Boolean)
    if (optionsList.length < 2) {
      setRequestError('At least 2 comma-separated options required')
      return
    }

    setSubmittingRequest(true)
    setRequestError('')

    const content = `Suggesting new event: ${eventTitle} (${sport})`
    try {
      const res = await fetch(`/api/competitions/${competitionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'platform_event_request',
          content,
          requestMeta: { sport, eventTitle, eventDate, options: optionsList },
        }),
      })
      if (!res.ok) {
        setRequestError('Failed to submit suggestion')
        return
      }
      closeRequestForm()
      await fetchMessages(true)
    } catch {
      setRequestError('Failed to submit suggestion')
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleResolve = async (messageId: string, action: 'approve' | 'reject') => {
    setResolvingId(messageId)
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      )
      if (!res.ok) return
      await fetchMessages(true)
    } catch {
      // Will reflect on next poll
    } finally {
      setResolvingId(null)
    }
  }

  const sportColor = (sport: string) =>
    SPORT_COLORS[sport] ?? SPORT_COLORS['Multi-sport'] ?? '#666'

  const statusIcon = (status?: string | null) => {
    if (status === 'approved') return <CheckCircle className="w-3.5 h-3.5 text-green-500" />
    if (status === 'rejected') return <XCircle className="w-3.5 h-3.5 text-red-500" />
    return <Clock className="w-3.5 h-3.5 text-amber-500" />
  }

  // Filtered available events for the picker
  const filteredEvents = availableEvents.filter((e) => {
    const matchesSport = eventSportFilter === 'All' || e.sport === eventSportFilter
    const q = eventSearch.toLowerCase()
    const label = e.title ?? `${e.team1Name ?? ''} vs ${e.team2Name ?? ''}`
    return matchesSport && (!q || label.toLowerCase().includes(q) || e.sport.toLowerCase().includes(q))
  })

  const uniqueSports = Array.from(new Set(availableEvents.map((e) => e.sport))).sort()

  return (
    <>
      {/* Popup notification toast */}
      {popupNotif && !isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 max-w-[240px] bg-background border border-border rounded-xl shadow-xl px-3 py-2.5 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setPopupNotif(null) }}
            className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="text-[11px] font-bold text-primary pr-4">{popupNotif.from}</p>
          <p className="text-xs text-muted-foreground mt-0.5 pr-2 leading-snug">{popupNotif.preview}</p>
        </div>
      )}

      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 brand-gradient rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open group chat"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-sm h-full bg-background border-l border-border shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-bold uppercase tracking-wider truncate">
                  {competitionName} Chat
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loading && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs mt-1">Start the conversation!</p>
                </div>
              )}

              {messages.map((msg) => {
                const isOwn = msg.userId === currentUserId

                // Event request card (link existing event to competition)
                if (msg.type === 'event_request') {
                  const meta = msg.requestMeta
                  const color = meta?.sport ? sportColor(meta.sport) : '#666'
                  const isResolving = resolvingId === msg.id
                  const eventLabel = meta?.eventTitle ?? 'Event'
                  return (
                    <div key={msg.id} className="space-y-1">
                      <div className={`flex items-center gap-1.5 ${isOwn ? 'justify-end' : ''}`}>
                        {!isOwn && (
                          <div className="w-5 h-5 brand-gradient rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                            {msg.user.name?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {isOwn ? 'You' : (msg.user.name ?? 'User')} · {format(new Date(msg.createdAt), 'h:mm a')}
                        </span>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                        <div
                          className="px-3 py-1.5 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                          style={{ backgroundColor: color }}
                        >
                          <span>{meta?.sport ?? 'Event'}</span>
                          <span className="opacity-70">· Add to Competition</span>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          <p className="text-sm font-semibold">{eventLabel}</p>
                          {meta?.eventDate && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(meta.eventDate), 'dd MMM yyyy')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            {statusIcon(msg.status)}
                            <span className="text-[10px] text-muted-foreground">
                              {msg.status === 'approved' ? 'Approved — event added to competition'
                                : msg.status === 'rejected' ? 'Rejected'
                                : 'Pending commissioner review'}
                            </span>
                          </div>
                          {currentUserIsCommissioner && msg.status === 'pending' && (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleResolve(msg.id, 'approve')}
                                disabled={isResolving !== null}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {isResolving ? '...' : 'Approve & Add'}
                              </button>
                              <button
                                onClick={() => handleResolve(msg.id, 'reject')}
                                disabled={isResolving !== null}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                {isResolving ? '...' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                // Platform event suggestion card (new event sent to admins)
                if (msg.type === 'platform_event_request') {
                  const meta = msg.requestMeta
                  return (
                    <div key={msg.id} className="space-y-1">
                      <div className={`flex items-center gap-1.5 ${isOwn ? 'justify-end' : ''}`}>
                        {!isOwn && (
                          <div className="w-5 h-5 brand-gradient rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                            {msg.user.name?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {isOwn ? 'You' : (msg.user.name ?? 'User')} · {format(new Date(msg.createdAt), 'h:mm a')}
                        </span>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                        <div className="px-3 py-1.5 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 bg-blue-600">
                          {meta?.sport && <span>{meta.sport}</span>}
                          <Globe className="w-3 h-3" />
                          <span className="opacity-80">Platform Suggestion</span>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          <p className="text-sm font-semibold">{meta?.eventTitle ?? 'New Event'}</p>
                          {meta?.eventDate && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(meta.eventDate as string), 'dd MMM yyyy')}
                            </p>
                          )}
                          {meta?.options && Array.isArray(meta.options) && (
                            <p className="text-xs text-muted-foreground truncate">
                              Options: {(meta.options as string[]).join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Globe className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] text-muted-foreground">Sent to platform admins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                // Regular chat message
                return (
                  <div key={msg.id} className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <div className="w-5 h-5 brand-gradient rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                          {msg.user.name?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {isOwn ? 'You' : (msg.user.name ?? 'User')} · {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                        isOwn
                          ? 'brand-gradient text-white rounded-tr-sm'
                          : 'bg-muted/60 border border-border text-foreground rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {error && (
              <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-500 text-xs flex-shrink-0">
                {error}
              </div>
            )}

            {/* Event request form */}
            {showRequestForm ? (
              <div className="border-t border-border flex-shrink-0 bg-muted/10">
                {/* Form header + tabs */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Request Event</span>
                    <button onClick={closeRequestForm} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
                    <button
                      onClick={() => { setRequestTab('existing'); setRequestError('') }}
                      className={`flex-1 py-1.5 transition-colors ${
                        requestTab === 'existing'
                          ? 'brand-gradient text-white'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Add Existing
                    </button>
                    <button
                      onClick={() => { setRequestTab('new'); setRequestError('') }}
                      className={`flex-1 py-1.5 transition-colors ${
                        requestTab === 'new'
                          ? 'bg-blue-600 text-white'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Suggest New
                    </button>
                  </div>
                </div>

                {requestError && (
                  <p className="px-4 text-red-500 text-xs pb-1">{requestError}</p>
                )}

                {/* Tab: Add existing event to competition */}
                {requestTab === 'existing' && (
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-[10px] text-muted-foreground">
                      Ask the commissioner to add an existing platform event to this competition.
                    </p>

                    {/* Sport filter */}
                    {uniqueSports.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {['All', ...uniqueSports].map((s) => (
                          <button
                            key={s}
                            onClick={() => setEventSportFilter(s)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
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
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Event list */}
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-border bg-background">
                      {loadingEvents ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      ) : filteredEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          {availableEvents.length === 0 ? 'No events available to add' : 'No events match your search'}
                        </p>
                      ) : (
                        filteredEvents.map((ev) => {
                          const label = ev.title ?? `${ev.team1Name ?? '?'} vs ${ev.team2Name ?? '?'}`
                          const color = sportColor(ev.sport)
                          return (
                            <label
                              key={ev.id}
                              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                                selectedEventId === ev.id ? 'bg-primary/10' : ''
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
                                <p className="text-xs font-medium truncate">{label}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  <span
                                    className="inline-block px-1 rounded text-white mr-1"
                                    style={{ backgroundColor: color, fontSize: '9px' }}
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
                      onClick={handleSubmitExistingRequest}
                      disabled={!selectedEventId || submittingRequest}
                      className="w-full px-3 py-2 brand-gradient text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-opacity"
                    >
                      {submittingRequest ? 'Submitting...' : 'Request to Commissioner'}
                    </button>
                  </div>
                )}

                {/* Tab: Suggest brand-new event to platform admins */}
                {requestTab === 'new' && (
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-[10px] text-muted-foreground">
                      Suggest a completely new event to platform admins. They'll review and add it if approved.
                    </p>

                    <div className="relative">
                      <select
                        value={newEventForm.sport}
                        onChange={(e) => setNewEventForm((f) => ({ ...f, sport: e.target.value }))}
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-7"
                      >
                        <option value="">Sport...</option>
                        {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                    </div>

                    <input
                      type="text"
                      placeholder="Event title..."
                      value={newEventForm.eventTitle}
                      onChange={(e) => setNewEventForm((f) => ({ ...f, eventTitle: e.target.value }))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    <input
                      type="date"
                      value={newEventForm.eventDate}
                      onChange={(e) => setNewEventForm((f) => ({ ...f, eventDate: e.target.value }))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    <input
                      type="text"
                      placeholder="Options (comma-separated, min 2)..."
                      value={newEventForm.options}
                      onChange={(e) => setNewEventForm((f) => ({ ...f, options: e.target.value }))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    <button
                      onClick={handleSubmitNewEventRequest}
                      disabled={submittingRequest}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {submittingRequest ? 'Submitting...' : 'Suggest to Platform Admins'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Compose bar */
              <div className="border-t border-border px-3 py-2 flex items-end gap-2 flex-shrink-0">
                <button
                  onClick={openRequestForm}
                  title="Request an event"
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Event</span>
                </button>

                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  rows={1}
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary max-h-24 overflow-y-auto"
                />

                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="flex-shrink-0 w-8 h-8 brand-gradient rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity hover:scale-105"
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
