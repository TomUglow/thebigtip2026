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
  sport: string
  eventDate: string
  status: string
  team1Name: string
  team1Abbr: string
  team1Odds: string | null
  team2Name: string
  team2Abbr: string
  team2Odds: string | null
}
