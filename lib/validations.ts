import { z } from 'zod'

/**
 * Shared validation schemas used across the application
 * Single source of truth for data validation
 */

// Username validation: 3-20 chars, alphanumeric + underscore only
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

// Email validation
export const emailSchema = z.string().email('Invalid email format')

// Password validation
export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

// Registration form validation
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  mobile: z.string().optional(),
  postcode: z.string().optional(),
  favoriteTeams: z
    .array(z.object({ sport: z.string(), team: z.string() }))
    .optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>

// Profile update validation
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  postcode: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Team management validation
export const teamSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  team: z.string().min(1, 'Team is required'),
})

export type TeamInput = z.infer<typeof teamSchema>

// Pick validation: user's prediction on an event within a specific competition
export const pickSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  competitionId: z.string().min(1, 'Competition ID is required'),
  selectedTeam: z.string().min(1, 'Selected team is required'),
})

export type PickInput = z.infer<typeof pickSchema>

// Competition creation validation
export const competitionCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Competition name is required')
    .max(100, 'Competition name must be 100 characters or less'),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  eventIds: z
    .array(z.string())
    .min(1, 'At least one event must be selected'),
})

export type CompetitionCreateInput = z.infer<typeof competitionCreateSchema>

// Join competition by code validation
export const joinByCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
})

export type JoinByCodeInput = z.infer<typeof joinByCodeSchema>

// Chat message creation validation
// type "chat"                  — regular message
// type "event_request"         — request to add an existing platform event to this competition (→ commissioner)
// type "platform_event_request"— suggest a brand-new event to platform admins (→ admins)
export const messageCreateSchema = z
  .object({
    type: z.enum(['chat', 'event_request', 'platform_event_request']),
    content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
    // Flexible JSON metadata — validated per-type in the API route
    requestMeta: z.record(z.unknown()).optional(),
  })
  .refine((d) => d.type === 'chat' || !!d.requestMeta, {
    message: 'requestMeta is required for event requests',
    path: ['requestMeta'],
  })

export type MessageCreateInput = z.infer<typeof messageCreateSchema>
