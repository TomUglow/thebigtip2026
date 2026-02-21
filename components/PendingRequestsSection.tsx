'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Loader2, Inbox } from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'
import type { ChatMessage } from '@/lib/types'

interface PendingRequestsSectionProps {
  competitionId: string
}

export default function PendingRequestsSection({ competitionId }: PendingRequestsSectionProps) {
  const [requests, setRequests] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/messages?type=event_request&status=pending`
      )
      if (!res.ok) return
      const data = await res.json()
      setRequests(data.messages ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [competitionId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

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
      if (res.ok) {
        await fetchRequests()
      }
    } catch {
      // ignore
    } finally {
      setResolvingId(null)
    }
  }

  const sportColor = (sport: string) => SPORT_COLORS[sport] ?? SPORT_COLORS['Multi-sport'] ?? '#666'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Inbox className="w-6 h-6 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No pending event requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const meta = req.requestMeta
        const color = meta?.sport ? sportColor(meta.sport) : '#666'
        const isResolving = resolvingId === req.id
        const eventLabel = meta?.eventTitle ?? 'Event'
        return (
          <div key={req.id} className="rounded-xl border border-border bg-muted/30 overflow-hidden">
            <div
              className="px-3 py-1.5 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ backgroundColor: color }}
            >
              <span>{meta?.sport ?? 'Event'}</span>
              <span className="opacity-70">· Add to Competition</span>
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <p className="text-sm font-semibold">{eventLabel}</p>
              {meta?.eventDate && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(meta.eventDate), 'dd MMM yyyy')}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Requested by{' '}
                <span className="font-medium text-foreground">{req.user.name ?? 'a member'}</span>
                {' · '}
                {format(new Date(req.createdAt), 'd MMM, h:mm a')}
              </p>
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={() => handleResolve(req.id, 'approve')}
                  disabled={isResolving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3 h-3" />
                  {isResolving ? '...' : 'Approve & Add'}
                </button>
                <button
                  onClick={() => handleResolve(req.id, 'reject')}
                  disabled={isResolving}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" />
                  {isResolving ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
