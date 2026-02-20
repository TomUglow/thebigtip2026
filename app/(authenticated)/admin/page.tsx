'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Calendar,
  Trophy,
  Trash2,
  Shield,
  ShieldOff,
  CheckCircle2,
  Plus,
  RefreshCw,
  AlertTriangle,
  Layers,
  Pencil,
  X,
  Check,
  Bell,
} from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'

type Tab = 'members' | 'events' | 'competitions' | 'results' | 'requests'

interface AdminUser {
  id: string
  email: string
  username: string
  name: string | null
  isAdmin: boolean
  createdAt: string
  _count: { competitions: number; picks: number }
}

interface AdminEvent {
  id: string
  eventNumber: number | null
  title: string | null
  sport: string
  options: string[] | null
  eventDate: string
  status: string
  winner: string | null
  score: string | null
  _count: { picks: number; competitions: number }
}

interface AdminCompetition {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  status: string
  startDate: string
  endDate: string
  owner: { id: string; name: string | null; email: string }
  _count: { users: number; events: number }
}

interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  data: {
    requestMeta?: {
      sport?: string
      eventTitle?: string
      eventDate?: string
      options?: string | string[]
    }
    competitionId?: string
    competitionName?: string
    requesterName?: string
  } | null
  read: boolean
  createdAt: string
}

const SPORTS = ['AFL', 'NRL', 'Basketball', 'Soccer', 'Ice Hockey', 'Cricket', 'Tennis', 'Rugby Union']

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('members')

  // Members
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null)

  // Events
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [sportFilter, setSportFilter] = useState('All')
  const [createEventLoading, setCreateEventLoading] = useState(false)
  const [createEventError, setCreateEventError] = useState('')
  const [createEventSuccess, setCreateEventSuccess] = useState('')
  // Inline edit state: eventId → draft title/sport
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [editEventTitle, setEditEventTitle] = useState('')
  const [editEventSport, setEditEventSport] = useState('')
  const [editEventSaving, setEditEventSaving] = useState(false)
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<string | null>(null)

  // New event form
  const [sport, setSport] = useState(SPORTS[0])
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [team1Name, setTeam1Name] = useState('')
  const [team1Abbr, setTeam1Abbr] = useState('')
  const [team1Odds, setTeam1Odds] = useState('')
  const [team2Name, setTeam2Name] = useState('')
  const [team2Abbr, setTeam2Abbr] = useState('')
  const [team2Odds, setTeam2Odds] = useState('')

  // Competitions
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([])
  const [compsLoading, setCompsLoading] = useState(false)
  const [createCompLoading, setCreateCompLoading] = useState(false)
  const [createCompError, setCreateCompError] = useState('')
  const [createCompSuccess, setCreateCompSuccess] = useState('')
  // Inline edit state: competitionId → draft name/description
  const [editingComp, setEditingComp] = useState<string | null>(null)
  const [editCompName, setEditCompName] = useState('')
  const [editCompDesc, setEditCompDesc] = useState('')
  const [editCompSaving, setEditCompSaving] = useState(false)
  const [confirmDeleteComp, setConfirmDeleteComp] = useState<string | null>(null)

  // New competition form
  const [compName, setCompName] = useState('')
  const [compDescription, setCompDescription] = useState('')
  const [compStartDate, setCompStartDate] = useState('')
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())

  // Results
  const [resultWinners, setResultWinners] = useState<Record<string, string>>({})
  const [resultScores, setResultScores] = useState<Record<string, string>>({})
  const [resultLoading, setResultLoading] = useState<Record<string, boolean>>({})
  const [resultSuccess, setResultSuccess] = useState<Record<string, boolean>>({})

  // Requests
  const [requests, setRequests] = useState<AdminNotification[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [dismissingRequest, setDismissingRequest] = useState<string | null>(null)

  useEffect(() => {
    if (session && !session.user.isAdmin) router.push('/dashboard')
  }, [session, router])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const res = await fetch('/api/admin/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
        const initWinners: Record<string, string> = {}
        data.forEach((e: AdminEvent) => {
          if (e.status !== 'completed' && e.options && e.options.length > 0) {
            initWinners[e.id] = e.options[0]
          }
        })
        setResultWinners((prev) => ({ ...initWinners, ...prev }))
      }
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const fetchCompetitions = useCallback(async () => {
    setCompsLoading(true)
    try {
      const res = await fetch('/api/admin/competitions')
      if (res.ok) setCompetitions(await res.json())
    } finally {
      setCompsLoading(false)
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const res = await fetch('/api/notifications?type=platform_event_request')
      if (res.ok) {
        const data = await res.json()
        setRequests(Array.isArray(data.data) ? data.data : [])
      }
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'members') fetchUsers()
    if (activeTab === 'events' || activeTab === 'results') fetchEvents()
    if (activeTab === 'competitions') { fetchCompetitions(); fetchEvents() }
    if (activeTab === 'requests') fetchRequests()
  }, [activeTab, fetchUsers, fetchEvents, fetchCompetitions, fetchRequests])

  // ── Members ──────────────────────────────────────────────────────────────
  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: !currentIsAdmin }),
    })
    if (res.ok) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u))
  }

  const handleDeleteUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) { setUsers((prev) => prev.filter((u) => u.id !== userId)); setConfirmDeleteUser(null) }
  }

  // ── Events ───────────────────────────────────────────────────────────────
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateEventError(''); setCreateEventSuccess('')
    const options = optionsText.split('\n').map((o) => o.trim()).filter(Boolean)
    if (options.length < 2) { setCreateEventError('Enter at least 2 options (one per line)'); return }
    setCreateEventLoading(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport, title, options, eventDate,
          team1Name: team1Name || undefined, team1Abbr: team1Abbr || undefined, team1Odds: team1Odds || undefined,
          team2Name: team2Name || undefined, team2Abbr: team2Abbr || undefined, team2Odds: team2Odds || undefined,
        }),
      })
      if (res.ok) {
        setCreateEventSuccess('Event created and linked to all public competitions')
        setTitle(''); setEventDate(''); setOptionsText('')
        setTeam1Name(''); setTeam1Abbr(''); setTeam1Odds('')
        setTeam2Name(''); setTeam2Abbr(''); setTeam2Odds('')
        fetchEvents()
      } else {
        const data = await res.json()
        setCreateEventError(data.error || 'Failed to create event')
      }
    } finally { setCreateEventLoading(false) }
  }

  const startEditEvent = (event: AdminEvent) => {
    setEditingEvent(event.id)
    setEditEventTitle(event.title || '')
    setEditEventSport(event.sport)
  }

  const handleSaveEvent = async (eventId: string) => {
    setEditEventSaving(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editEventTitle, sport: editEventSport }),
      })
      if (res.ok) {
        setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, title: editEventTitle, sport: editEventSport } : e))
        setEditingEvent(null)
      }
    } finally { setEditEventSaving(false) }
  }

  const handleDeleteEvent = async (eventId: string) => {
    const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' })
    if (res.ok) { setEvents((prev) => prev.filter((e) => e.id !== eventId)); setConfirmDeleteEvent(null) }
  }

  // ── Competitions ──────────────────────────────────────────────────────────
  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) => { const next = new Set(prev); next.has(eventId) ? next.delete(eventId) : next.add(eventId); return next })
  }

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateCompError(''); setCreateCompSuccess('')
    if (selectedEventIds.size === 0) { setCreateCompError('Select at least one event'); return }
    setCreateCompLoading(true)
    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: compName, description: compDescription || undefined, startDate: compStartDate, eventIds: Array.from(selectedEventIds) }),
      })
      if (res.ok) {
        setCreateCompSuccess('Public competition created successfully')
        setCompName(''); setCompDescription(''); setCompStartDate(''); setSelectedEventIds(new Set())
        fetchCompetitions()
      } else {
        const data = await res.json()
        setCreateCompError(data.error || 'Failed to create competition')
      }
    } finally { setCreateCompLoading(false) }
  }

  const startEditComp = (comp: AdminCompetition) => {
    setEditingComp(comp.id)
    setEditCompName(comp.name)
    setEditCompDesc(comp.description || '')
  }

  const handleSaveComp = async (compId: string) => {
    setEditCompSaving(true)
    try {
      const res = await fetch(`/api/admin/competitions/${compId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCompName, description: editCompDesc || undefined }),
      })
      if (res.ok) {
        setCompetitions((prev) => prev.map((c) => c.id === compId ? { ...c, name: editCompName, description: editCompDesc || null } : c))
        setEditingComp(null)
      }
    } finally { setEditCompSaving(false) }
  }

  const handleDeleteComp = async (compId: string) => {
    const res = await fetch(`/api/admin/competitions/${compId}`, { method: 'DELETE' })
    if (res.ok) { setCompetitions((prev) => prev.filter((c) => c.id !== compId)); setConfirmDeleteComp(null) }
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const handleSetResult = async (eventId: string) => {
    const winner = resultWinners[eventId]
    if (!winner) return
    setResultLoading((prev) => ({ ...prev, [eventId]: true }))
    try {
      const res = await fetch(`/api/admin/events/${eventId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner, score: resultScores[eventId] || undefined }),
      })
      if (res.ok) {
        setResultSuccess((prev) => ({ ...prev, [eventId]: true }))
        setEvents((prev) => prev.map((ev) => ev.id === eventId ? { ...ev, status: 'completed', winner } : ev))
      }
    } finally { setResultLoading((prev) => ({ ...prev, [eventId]: false })) }
  }

  // ── Requests ──────────────────────────────────────────────────────────────
  const handleDismissRequest = async (notificationId: string) => {
    setDismissingRequest(notificationId)
    try {
      await fetch(`/api/notifications?id=${notificationId}`, { method: 'DELETE' })
      setRequests((prev) => prev.filter((r) => r.id !== notificationId))
    } finally {
      setDismissingRequest(null)
    }
  }

  const handleCreateFromRequest = (req: AdminNotification) => {
    const meta = req.data?.requestMeta
    if (meta) {
      if (meta.sport && SPORTS.includes(meta.sport)) setSport(meta.sport)
      if (meta.eventTitle) setTitle(meta.eventTitle)
      if (meta.eventDate) setEventDate(meta.eventDate.slice(0, 10))
      if (meta.options) setOptionsText(Array.isArray(meta.options) ? meta.options.join('\n') : meta.options)
    }
    setActiveTab('events')
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const uniqueSports = ['All', ...Array.from(new Set(events.map((e) => e.sport))).sort()]
  const filteredEvents = sportFilter === 'All' ? events : events.filter((e) => e.sport === sportFilter)
  const eventsNeedingResults = events.filter((e) => e.status !== 'completed' && !resultSuccess[e.id])
  const selectableEvents = events.filter((e) => e.status !== 'completed')

  const unreadRequestCount = requests.filter((r) => !r.read).length

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'competitions', label: 'Competitions', icon: Layers },
    { id: 'results', label: 'Results', icon: Trophy },
    { id: 'requests', label: 'Requests', icon: Bell, badge: unreadRequestCount },
  ]

  // Shared input class
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage members, events, competitions, and results</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-8 p-1 glass-card rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors relative ${
              activeTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge != null && badge > 0 && (
              <span className="ml-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-bold text-lg">All Members</h2>
            <button onClick={fetchUsers} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          </div>
          {usersLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 font-semibold text-muted-foreground">User</th>
                    <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Email</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Picks</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Comps</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Admin</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 brand-gradient rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {(user.name || user.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{user.name || user.username}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-4 text-center">{user._count.picks}</td>
                      <td className="px-4 py-4 text-center">{user._count.competitions}</td>
                      <td className="px-4 py-4 text-center">
                        {user.isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {user.id !== session?.user?.id ? (
                            <>
                              <button
                                onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                                className={`p-1.5 rounded-lg transition-colors ${user.isAdmin ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                                title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                              >
                                {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </button>
                              {confirmDeleteUser === user.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDeleteUser(user.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors">Confirm</button>
                                  <button onClick={() => setConfirmDeleteUser(null)} className="text-xs px-2 py-1 border border-border rounded font-semibold hover:bg-muted transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteUser(user.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete user">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          ) : <span className="text-xs text-muted-foreground italic">You</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div className="text-center py-16 text-muted-foreground">No users found</div>}
            </div>
          )}
        </div>
      )}

      {/* ── EVENTS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Create form */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Plus className="w-5 h-5" /> Create Public Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Sport</label>
                  <select value={sport} onChange={(e) => setSport(e.target.value)} className={inputCls} required>
                    {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AFL Round 1 — Richmond vs Collingwood" className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Event Date & Time</label>
                  <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Pick Options <span className="font-normal text-muted-foreground">(one per line)</span></label>
                  <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder={"Richmond\nCollingwood"} rows={3} className={`${inputCls} resize-none`} required />
                </div>
              </div>
              <details className="mt-2">
                <summary className="text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Optional: Team details & odds</summary>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {[
                    { label: 'Team 1 Name', val: team1Name, set: setTeam1Name },
                    { label: 'Team 1 Abbr', val: team1Abbr, set: setTeam1Abbr },
                    { label: 'Team 1 Odds', val: team1Odds, set: setTeam1Odds },
                    { label: 'Team 2 Name', val: team2Name, set: setTeam2Name },
                    { label: 'Team 2 Abbr', val: team2Abbr, set: setTeam2Abbr },
                    { label: 'Team 2 Odds', val: team2Odds, set: setTeam2Odds },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold mb-1 text-muted-foreground">{label}</label>
                      <input type="text" value={val} onChange={(e) => set(e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
              </details>
              {createEventError && <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg"><AlertTriangle className="w-4 h-4 shrink-0" /> {createEventError}</div>}
              {createEventSuccess && <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg"><CheckCircle2 className="w-4 h-4 shrink-0" /> {createEventSuccess}</div>}
              <button type="submit" disabled={createEventLoading} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {createEventLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Event
              </button>
            </form>
          </div>

          {/* Events list */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg">All Events</h2>
              <button onClick={fetchEvents} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>

            {/* Sport filter pills */}
            {!eventsLoading && events.length > 0 && (
              <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2">
                {uniqueSports.map((s) => {
                  const color = s !== 'All' ? (SPORT_COLORS[s] || '#6b7280') : undefined
                  const isActive = sportFilter === s
                  return (
                    <button
                      key={s}
                      onClick={() => setSportFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                        isActive ? 'text-white border-transparent' : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
                      }`}
                      style={isActive && color ? { backgroundColor: color, borderColor: color } : isActive ? undefined : {}}
                    >
                      {s === 'All' && isActive ? (
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold -mx-3 -my-1 block">All</span>
                      ) : s}
                    </button>
                  )
                })}
              </div>
            )}

            {eventsLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Title</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Sport</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Picks</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Comps</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Winner</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        {editingEvent === event.id ? (
                          <>
                            <td className="px-4 py-3" colSpan={2}>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editEventTitle}
                                  onChange={(e) => setEditEventTitle(e.target.value)}
                                  className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder="Title"
                                  autoFocus
                                />
                                <select
                                  value={editEventSport}
                                  onChange={(e) => setEditEventSport(e.target.value)}
                                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(event.eventDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td colSpan={4} />
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleSaveEvent(event.id)} disabled={editEventSaving} className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors" title="Save">
                                  {editEventSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setEditingEvent(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Cancel">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 font-medium max-w-[180px] truncate">{event.title || '—'}</td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ backgroundColor: SPORT_COLORS[event.sport] || '#6b7280' }}>
                                {event.sport}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                              {new Date(event.eventDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                event.status === 'completed' ? 'bg-green-500/10 text-green-500'
                                : event.status === 'live' ? 'bg-red-500/10 text-red-500'
                                : 'bg-muted text-muted-foreground'
                              }`}>{event.status}</span>
                            </td>
                            <td className="px-4 py-4 text-center">{event._count.picks}</td>
                            <td className="px-4 py-4 text-center">{event._count.competitions}</td>
                            <td className="px-4 py-4 text-muted-foreground">{event.winner || '—'}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => startEditEvent(event)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Edit">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteEvent === event.id ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleDeleteEvent(event.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors">Confirm</button>
                                    <button onClick={() => setConfirmDeleteEvent(null)} className="text-xs px-2 py-1 border border-border rounded font-semibold hover:bg-muted transition-colors">Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteEvent(event.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEvents.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    {events.length === 0 ? 'No events yet' : `No ${sportFilter} events`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPETITIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'competitions' && (
        <div className="space-y-6">
          {/* Create form */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Plus className="w-5 h-5" /> Create Public Competition</h2>
            <form onSubmit={handleCreateCompetition} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Competition Name</label>
                  <input type="text" value={compName} onChange={(e) => setCompName(e.target.value)} placeholder="e.g. AFL 2026 Season Tips" className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Tips Close Date <span className="font-normal text-muted-foreground">(picks lock after this)</span></label>
                  <input type="datetime-local" value={compStartDate} onChange={(e) => setCompStartDate(e.target.value)} className={inputCls} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1.5">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <input type="text" value={compDescription} onChange={(e) => setCompDescription(e.target.value)} placeholder="Brief description of the competition" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Select Events <span className="font-normal text-muted-foreground">({selectedEventIds.size} selected)</span></label>
                {eventsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><RefreshCw className="w-4 h-4 animate-spin" /> Loading events...</div>
                ) : selectableEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No upcoming events. Create events first.</p>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {selectableEvents.map((event, idx) => (
                      <label key={event.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${idx < selectableEvents.length - 1 ? 'border-b border-border/50' : ''} ${selectedEventIds.has(event.id) ? 'bg-primary/5' : ''}`}>
                        <input type="checkbox" checked={selectedEventIds.has(event.id)} onChange={() => toggleEventSelection(event.id)} className="w-4 h-4 rounded accent-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{event.title || `${event.sport} Event`}</div>
                          <div className="text-xs text-muted-foreground">{event.sport} · {new Date(event.eventDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${event.status === 'live' ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>{event.status}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {createCompError && <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg"><AlertTriangle className="w-4 h-4 shrink-0" /> {createCompError}</div>}
              {createCompSuccess && <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg"><CheckCircle2 className="w-4 h-4 shrink-0" /> {createCompSuccess}</div>}
              <button type="submit" disabled={createCompLoading} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {createCompLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Competition
              </button>
            </form>
          </div>

          {/* Competitions list */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg">All Competitions</h2>
              <button onClick={fetchCompetitions} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {compsLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Name</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Visibility</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Members</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Events</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Owner</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitions.map((comp) => (
                      <tr key={comp.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        {editingComp === comp.id ? (
                          <>
                            <td className="px-4 py-3" colSpan={2}>
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={editCompName}
                                  onChange={(e) => setEditCompName(e.target.value)}
                                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder="Competition name"
                                  autoFocus
                                />
                                <input
                                  type="text"
                                  value={editCompDesc}
                                  onChange={(e) => setEditCompDesc(e.target.value)}
                                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground"
                                  placeholder="Description (optional)"
                                />
                              </div>
                            </td>
                            <td colSpan={4} />
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleSaveComp(comp.id)} disabled={editCompSaving} className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors" title="Save">
                                  {editCompSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setEditingComp(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Cancel">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <div className="font-semibold">{comp.name}</div>
                              {comp.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{comp.description}</div>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${comp.isPublic ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                                {comp.isPublic ? 'Public' : 'Private'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                comp.status === 'active' ? 'bg-green-500/10 text-green-500'
                                : comp.status === 'completed' ? 'bg-muted text-muted-foreground'
                                : 'bg-yellow-500/10 text-yellow-600'
                              }`}>{comp.status}</span>
                            </td>
                            <td className="px-4 py-4 text-center">{comp._count.users}</td>
                            <td className="px-4 py-4 text-center">{comp._count.events}</td>
                            <td className="px-4 py-4 text-muted-foreground text-xs">{comp.owner.name || comp.owner.email}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => startEditComp(comp)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Edit">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteComp === comp.id ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleDeleteComp(comp.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors">Confirm</button>
                                    <button onClick={() => setConfirmDeleteComp(null)} className="text-xs px-2 py-1 border border-border rounded font-semibold hover:bg-muted transition-colors">Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteComp(comp.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {competitions.length === 0 && <div className="text-center py-16 text-muted-foreground">No competitions yet</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESULTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'results' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="font-bold text-lg">Set Event Results</h2>
              <p className="text-sm text-muted-foreground">Confirm the winner to update all picks and scores</p>
            </div>
            <button onClick={fetchEvents} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          </div>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
          ) : eventsNeedingResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-semibold">All events have results</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {eventsNeedingResults.map((event) => (
                <div key={event.id} className="px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{event.title || `${event.sport} Event`}</div>
                    <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: SPORT_COLORS[event.sport] || '#6b7280' }}>{event.sport}</span>
                      {new Date(event.eventDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {event._count.picks} picks
                    </div>
                  </div>
                  {resultSuccess[event.id] ? (
                    <div className="flex items-center gap-2 text-sm text-green-500 font-semibold"><CheckCircle2 className="w-4 h-4" /> Result saved</div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Winner</label>
                        <select value={resultWinners[event.id] || ''} onChange={(e) => setResultWinners((prev) => ({ ...prev, [event.id]: e.target.value }))} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                          {(event.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Score <span className="font-normal">(optional)</span></label>
                        <input type="text" value={resultScores[event.id] || ''} onChange={(e) => setResultScores((prev) => ({ ...prev, [event.id]: e.target.value }))} placeholder="e.g. 3–1" className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div className="self-end">
                        <button onClick={() => handleSetResult(event.id)} disabled={resultLoading[event.id] || !resultWinners[event.id]} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                          {resultLoading[event.id] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Confirm Result
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ── REQUESTS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="font-bold text-lg">Platform Event Requests</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Suggestions from private competition members to add new events to the platform</p>
            </div>
            <button onClick={fetchRequests} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Bell className="w-10 h-10 opacity-30" />
              <p className="font-semibold">No pending event requests</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((req) => {
                const meta = req.data?.requestMeta
                return (
                  <div key={req.id} className={`px-6 py-5 ${!req.read ? 'bg-primary/5' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!req.read && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          )}
                          <span className="font-semibold text-sm">{req.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{req.message}</p>
                        {meta && (
                          <div className="glass-card rounded-xl p-4 space-y-2 text-sm">
                            {meta.sport && (
                              <div className="flex gap-3">
                                <span className="text-muted-foreground w-20 shrink-0">Sport</span>
                                <span className="font-semibold">{meta.sport}</span>
                              </div>
                            )}
                            {meta.eventTitle && (
                              <div className="flex gap-3">
                                <span className="text-muted-foreground w-20 shrink-0">Event</span>
                                <span className="font-semibold">{meta.eventTitle}</span>
                              </div>
                            )}
                            {meta.eventDate && (
                              <div className="flex gap-3">
                                <span className="text-muted-foreground w-20 shrink-0">Date</span>
                                <span className="font-semibold">
                                  {new Date(meta.eventDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                            {meta.options && (
                              <div className="flex gap-3">
                                <span className="text-muted-foreground w-20 shrink-0">Options</span>
                                <span className="font-semibold">
                                  {Array.isArray(meta.options) ? meta.options.join(', ') : meta.options}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(req.createdAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleCreateFromRequest(req)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create Event
                        </button>
                        <button
                          onClick={() => handleDismissRequest(req.id)}
                          disabled={dismissingRequest === req.id}
                          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                        >
                          {dismissingRequest === req.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
