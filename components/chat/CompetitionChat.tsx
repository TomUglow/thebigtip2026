'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format } from 'date-fns'
import { MessageSquare, X, Send, Plus, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ChatMessage } from '@/lib/types'

interface CompetitionChatProps {
  competitionId: string
  currentUserId: string
  currentUserIsCommissioner: boolean
}

const SPORTS = ['AFL', 'NRL', 'Basketball', 'Soccer', 'Tennis', 'Cricket', 'Rugby Union', 'NHL', 'Other']
const POLL_INTERVAL_MS = 30_000

export default function CompetitionChat({
  competitionId,
  currentUserId,
  currentUserIsCommissioner,
}: CompetitionChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Event request form state
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    sport: '',
    eventTitle: '',
    eventDate: '',
    options: '',
  })
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [requestError, setRequestError] = useState('')

  // Commissioner action state
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  // Unread count (messages received while panel is closed)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastSeenCountRef = useRef(0)

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
      // Update unread count when panel is closed
      if (!isOpen) {
        const newCount = fetched.length - lastSeenCountRef.current
        if (newCount > 0) setUnreadCount(newCount)
      }
    } catch {
      // Silently ignore poll errors
    } finally {
      if (!silent) setLoading(false)
    }
  }, [competitionId, isOpen])

  // Initial fetch + polling
  useEffect(() => {
    fetchMessages()
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchMessages])

  // Scroll to bottom when new messages arrive and panel is open
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, isOpen, scrollToBottom])

  // Mark messages as seen when opening the panel
  useEffect(() => {
    if (isOpen) {
      lastSeenCountRef.current = messages.length
      setUnreadCount(0)
      setTimeout(scrollToBottom, 100)
      textareaRef.current?.focus()
    }
  }, [isOpen, messages.length, scrollToBottom])

  const handleSend = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || sending) return

    setSending(true)
    setError('')

    // Optimistic update
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
      // Replace optimistic message with real one on next poll
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

  const handleSubmitRequest = async () => {
    const { sport, eventTitle, eventDate, options } = requestForm
    if (!sport || !eventTitle || !eventDate || !options.trim()) {
      setRequestError('All fields are required')
      return
    }
    const optionsList = options
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    if (optionsList.length < 2) {
      setRequestError('At least 2 comma-separated options required')
      return
    }

    setSubmittingRequest(true)
    setRequestError('')

    const content = `Event request: ${eventTitle} (${sport})`
    try {
      const res = await fetch(`/api/competitions/${competitionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event_request',
          content,
          requestMeta: { sport, eventTitle, eventDate, options: optionsList },
        }),
      })
      if (!res.ok) {
        setRequestError('Failed to submit request')
        return
      }
      setShowRequestForm(false)
      setRequestForm({ sport: '', eventTitle: '', eventDate: '', options: '' })
      await fetchMessages(true)
    } catch {
      setRequestError('Failed to submit request')
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
      // Silently fail — will reflect on next poll
    } finally {
      setResolvingId(null)
    }
  }

  const sportColor = (sport: string) =>
    SPORT_COLORS[sport] ?? SPORT_COLORS['Multi-sport']

  const statusIcon = (status?: string | null) => {
    if (status === 'approved') return <CheckCircle className="w-3.5 h-3.5 text-green-500" />
    if (status === 'rejected') return <XCircle className="w-3.5 h-3.5 text-red-500" />
    return <Clock className="w-3.5 h-3.5 text-amber-500" />
  }

  const statusLabel = (status?: string | null) => {
    if (status === 'approved') return 'Approved — event added to competition'
    if (status === 'rejected') return 'Rejected'
    return 'Pending commissioner review'
  }

  return (
    <>
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-sm h-full bg-background border-l border-border shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider">Group Chat</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loading && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

                if (msg.type === 'event_request') {
                  const meta = msg.requestMeta
                  const color = meta ? sportColor(meta.sport) : '#666'
                  const isResolving = resolvingId === msg.id
                  return (
                    <div key={msg.id} className="space-y-1">
                      {/* Sender name + time */}
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

                      {/* Event request card */}
                      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                        <div
                          className="px-3 py-1.5 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                          style={{ backgroundColor: color }}
                        >
                          <span>{meta?.sport ?? 'Sport'}</span>
                          <span className="opacity-70">· Event Request</span>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          <p className="text-sm font-semibold">{meta?.eventTitle}</p>
                          {meta?.eventDate && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(meta.eventDate), 'dd MMM yyyy')}
                            </p>
                          )}
                          {meta?.options && (
                            <p className="text-xs text-muted-foreground truncate">
                              Options: {meta.options.join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            {statusIcon(msg.status)}
                            <span className="text-[10px] text-muted-foreground">
                              {statusLabel(msg.status)}
                            </span>
                          </div>

                          {/* Commissioner approve/reject buttons */}
                          {currentUserIsCommissioner && msg.status === 'pending' && (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleResolve(msg.id, 'approve')}
                                disabled={!!isResolving}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {isResolving ? '...' : 'Approve & Add Event'}
                              </button>
                              <button
                                onClick={() => handleResolve(msg.id, 'reject')}
                                disabled={!!isResolving}
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
              <div className="border-t border-border px-4 py-3 space-y-2 flex-shrink-0 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Request an Event</span>
                  <button
                    onClick={() => { setShowRequestForm(false); setRequestError('') }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {requestError && (
                  <p className="text-red-500 text-xs">{requestError}</p>
                )}

                {/* Sport selector */}
                <div className="relative">
                  <select
                    value={requestForm.sport}
                    onChange={(e) => setRequestForm((f) => ({ ...f, sport: e.target.value }))}
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
                  value={requestForm.eventTitle}
                  onChange={(e) => setRequestForm((f) => ({ ...f, eventTitle: e.target.value }))}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <input
                  type="date"
                  value={requestForm.eventDate}
                  onChange={(e) => setRequestForm((f) => ({ ...f, eventDate: e.target.value }))}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <input
                  type="text"
                  placeholder="Options (comma-separated, min 2)..."
                  value={requestForm.options}
                  onChange={(e) => setRequestForm((f) => ({ ...f, options: e.target.value }))}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <button
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest}
                  className="w-full px-3 py-2 brand-gradient text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-opacity"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            ) : (
              /* Compose bar */
              <div className="border-t border-border px-3 py-2 flex items-end gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowRequestForm(true)}
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
