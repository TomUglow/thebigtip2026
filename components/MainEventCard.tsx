'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Target, Clock } from 'lucide-react'
import type { Competition } from '@/lib/types'

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  const units = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HRS' },
    { value: timeLeft.minutes, label: 'MIN' },
    { value: timeLeft.seconds, label: 'SEC' },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <div className="bg-primary/90 text-white text-lg font-black w-12 h-12 rounded-lg flex items-center justify-center tabular-nums font-display">
              {String(unit.value).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-muted-foreground font-bold mt-1">{unit.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-xl font-black text-muted-foreground mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

interface MainEventCardProps {
  competitions?: Competition[]
}

export default function MainEventCard({ competitions: externalCompetitions }: MainEventCardProps) {
  const router = useRouter()
  const [fetchedCompetitions, setFetchedCompetitions] = useState<Competition[]>([])
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (externalCompetitions) return
    fetch('/api/dashboard')
      .then((res) => res.ok ? res.json() : { competitions: [] })
      .then((data) => setFetchedCompetitions(Array.isArray(data.competitions) ? data.competitions : []))
      .catch(() => {})
  }, [externalCompetitions])

  const competitions = externalCompetitions ?? fetchedCompetitions

  const mainCompetition = competitions.find(
    (c) => c.isPublic && (c.status === 'active' || c.status === 'upcoming')
  ) || competitions.find((c) => c.isPublic)

  const getMainButtonState = (comp: Competition) => {
    if (!comp.isJoined) return 'enter'
    if (comp.status === 'upcoming' || comp.status === 'active') return 'edit'
    return 'leaderboard'
  }

  const handleEnterNow = async (competitionId: string) => {
    setJoining(true)
    try {
      const res = await fetch('/api/competitions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId }),
      })
      if (res.ok) {
        router.push(`/lobby/${competitionId}`)
      }
    } catch (error) {
      console.error('Error joining competition:', error)
    } finally {
      setJoining(false)
    }
  }

  if (!mainCompetition) return null

  const state = getMainButtonState(mainCompetition)

  return (
    <section>
      <div
        className="glass-card rounded-xl overflow-hidden border-2 p-6"
        style={{ borderColor: '#FFD700' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded"
                style={{ backgroundColor: '#FFD700', color: '#000' }}
              >
                Main Event
              </span>
              {mainCompetition.entryFee === 0 && (
                <span className="text-[10px] px-2.5 py-0.5 rounded border border-border text-muted-foreground font-semibold">
                  Free Entry
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight font-display">
              {mainCompetition.name}
            </h2>

            {mainCompetition.description && (
              <p className="text-sm text-muted-foreground max-w-lg">
                {mainCompetition.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {mainCompetition.participantCount} tipsters
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" /> {mainCompetition.eventCount} events
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-2">
                <Clock className="w-3 h-3" /> TIPS CLOSE IN
              </div>
              <CountdownTimer targetDate={mainCompetition.startDate} />
            </div>

            {state === 'enter' && (
              <button
                onClick={() => handleEnterNow(mainCompetition.id)}
                disabled={joining}
                className="brand-gradient text-white text-sm font-bold px-6 py-2.5 rounded-lg hover-elevate disabled:opacity-50"
              >
                {joining ? 'Entering...' : 'Enter Now'}
              </button>
            )}
            {state === 'edit' && (
              <button
                onClick={() => router.push(`/lobby/${mainCompetition.id}`)}
                className="brand-gradient text-white text-sm font-bold px-6 py-2.5 rounded-lg hover-elevate"
              >
                Edit Tips
              </button>
            )}
            {state === 'leaderboard' && (
              <button
                onClick={() => router.push(`/lobby/${mainCompetition.id}`)}
                className="glass-card text-sm font-bold px-6 py-2.5 rounded-lg hover-elevate"
              >
                View Leaderboard
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
