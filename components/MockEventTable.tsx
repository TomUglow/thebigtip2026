import { Check } from 'lucide-react'
import { SPORT_COLORS } from '@/lib/constants'

const mockEvents = [
  {
    id: '1',
    sport: 'AFL',
    title: 'Collingwood vs Melbourne',
    date: '24 Feb 2026',
  },
  {
    id: '2',
    sport: 'NRL',
    title: 'Penrith vs South Sydney',
    date: '28 Feb 2026',
  },
  {
    id: '3',
    sport: 'Soccer',
    title: 'Chelsea vs Arsenal',
    date: '2 Mar 2026',
  },
]

export default function MockEventTable() {
  return (
    <div className="glass-card rounded-xl overflow-hidden border border-white/10">
      <div className="p-4 border-b border-border bg-muted/30">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Select Events
        </p>
      </div>

      {mockEvents.map((event, idx) => {
        const sportColor = SPORT_COLORS[event.sport] || '#D32F2F'
        const isLast = idx === mockEvents.length - 1

        return (
          <div
            key={event.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              !isLast ? 'border-b border-border' : ''
            } hover:bg-muted/20 transition-colors`}
          >
            {/* Checkbox */}
            <div className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>

            {/* Sport badge */}
            <span
              className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0 min-w-[70px] text-center"
              style={{ backgroundColor: `${sportColor}20`, color: sportColor }}
            >
              {event.sport}
            </span>

            {/* Event info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{event.title}</div>
              <div className="text-[11px] text-muted-foreground">{event.date}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
