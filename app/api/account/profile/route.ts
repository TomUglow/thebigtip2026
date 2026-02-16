import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validations'
import { apiError, apiSuccess, requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        name: true,
        mobile: true,
        postcode: true,
        avatar: true,
        profileCompleted: true,
      },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    return apiSuccess(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return apiError('Internal server error', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = requireAuth(session)
    if (userId instanceof Response) return userId

    const body = await request.json()

    // Validate input
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      console.error('Profile validation error:', result.error.errors)
      return apiError('Invalid input', 400)
    }

    const data = result.data

    // Check if new email/username already exists
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      })
      if (existingEmail && existingEmail.id !== userId) {
        return apiError('Email already taken', 409)
      }
    }

    if (data.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username.toLowerCase() },
      })
      if (existingUsername && existingUsername.id !== userId) {
        return apiError('Username already taken', 409)
      }
    }

    // Update user
    const updateData: any = {}
    if (data.username) updateData.username = data.username.toLowerCase()
    if (data.email) updateData.email = data.email.toLowerCase()
    if (data.name !== undefined) updateData.name = data.name || null
    if (data.mobile !== undefined) updateData.mobile = data.mobile || null
    if (data.postcode !== undefined) updateData.postcode = data.postcode || null

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        username: true,
        email: true,
        name: true,
        mobile: true,
        postcode: true,
        avatar: true,
      },
    })

    return apiSuccess(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return apiError('Internal server error', 500)
  }
}
