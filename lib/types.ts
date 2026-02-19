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

export interface Competition {
  id: string
  name: string
  description: string | null
  entryFee: number
  prizePool: number
  startDate: string
  endDate: string
  isPublic: boolean
  maxEvents: number
  status: string
  participantCount: number
  eventCount: number
  isJoined: boolean
  ownerId: string
  owner: { id: string; name: string | null }
  inviteCode: string | null
}

export interface LeaderboardEntry {
  rank: number
  user: { id: string; name: string | null; email: string; avatar: string | null }
  score: number
  role: string
}

/**
 * User's pick/prediction on an event
 */
export interface Pick {
  id: string
  eventId: string
  selectedTeam: string
  isCorrect: boolean | null
  points: number | null
  createdAt: string
  updatedAt: string
}

/**
 * User profile information
 */
export interface UserProfile {
  username: string
  email: string
  name: string | null
  mobile: string | null
  postcode: string | null
  avatar: string | null
  profileCompleted: boolean
}

/**
 * User's favorite team
 */
export interface FavoriteTeam {
  id: string
  sport: string
  team: string
}

/**
 * Competition with leaderboard and event details
 */
export interface CompetitionDetail extends Competition {
  events: Event[]
  leaderboard: LeaderboardEntry[]
}

/**
 * Dashboard data returned to authenticated users
 */
export interface DashboardData {
  competitions: Competition[]
  userPicks: Pick[]
  userRank: number | null
}

/**
 * Standardized API error response
 */
export interface ApiError {
  error: string
}
