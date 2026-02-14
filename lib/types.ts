export interface ScoreGame {
  id: string
  sport: string
  sportKey?: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  completed: boolean
  scores: { name: string; score: string }[] | null
  lastUpdate?: string | null
}

export interface Event {
  id: string
  eventNumber: number | null
  title: string | null
  sport: string
  options: string[] | null
  eventDate: string
  status: string
  team1Name: string | null
  team1Abbr: string | null
  team1Odds: string | null
  team2Name: string | null
  team2Abbr: string | null
  team2Odds: string | null
}
