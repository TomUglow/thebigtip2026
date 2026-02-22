import { NextResponse } from 'next/server'
import { SPORTS_CONFIG } from '@/lib/sports-config'

export const dynamic = 'force-dynamic'

export interface SportEntry {
  sport: string
  teams: string[]
  hasTeams: boolean
}

export async function GET() {
  const sports: SportEntry[] = SPORTS_CONFIG
    .map(({ name, teams, hasTeams }) => ({
      sport: name,
      teams,
      hasTeams,
    }))
    .sort((a, b) => a.sport.localeCompare(b.sport))

  return NextResponse.json({ sports })
}
