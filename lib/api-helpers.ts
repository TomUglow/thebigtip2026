import { NextResponse } from 'next/server'
import { Session } from 'next-auth'
import { ZodSchema, ZodError } from 'zod'

/**
 * Standardized API helper utilities
 * Provides consistent error handling, response formats, and session management
 */

/**
 * Standardized error response
 * Never leaks sensitive details or Zod internals to client
 */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * Standardized success response
 */
export function apiSuccess(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Validate request body against a Zod schema
 * Returns parsed data or an error response with status 400
 */
export async function validateBody<T>(
  body: any,
  schema: ZodSchema
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const data = schema.parse(body)
    return { success: true, data: data as T }
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.errors)
      return {
        success: false,
        response: apiError('Invalid request data', 400),
      }
    }
    throw error
  }
}

/**
 * Extract and validate authenticated user from session
 * Returns user ID or sends 401 response
 */
export function getAuthenticatedUser(session: Session | null): string | Response {
  if (!session?.user?.id) {
    return apiError('Unauthorized', 401)
  }
  return session.user.id
}

/**
 * Type-safe handler for getting user ID from session
 * Usage: const userId = requireAuth(session)
 * If userId is a Response, the handler should return it immediately
 */
export function requireAuth(session: Session | null): string | Response {
  return getAuthenticatedUser(session)
}
