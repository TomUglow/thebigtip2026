import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { registerSchema, normaliseMobile } from '@/lib/validations'
import { apiError, apiSuccess } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      console.error('Validation error:', result.error.errors)
      return apiError('Validation failed', 400)
    }

    const data = result.data
    const normalisedMobile = normaliseMobile(data.mobile)

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existingEmail) {
      return apiError('An account with this email already exists', 409)
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase() },
    })

    if (existingUsername) {
      return apiError('Username is already taken', 409)
    }

    // Check if mobile already exists
    const existingMobile = await prisma.user.findUnique({
      where: { mobile: normalisedMobile },
    })

    if (existingMobile) {
      return apiError('An account with this mobile number already exists', 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user with favorite teams in transaction
    const user = await prisma.user.create({
      data: {
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        mobile: normalisedMobile,
        postcode: data.postcode,
        ageVerified: true,
        termsAcceptedAt: new Date(),
        profileCompleted: true,
        favoriteTeams: {
          create: (data.favoriteTeams || []).map((team) => ({
            sport: team.sport,
            team: team.team,
          })),
        },
      },
      include: {
        favoriteTeams: true,
      },
    })

    return apiSuccess({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    }, 201)
  } catch (error) {
    console.error('Registration error:', error)
    return apiError('Something went wrong', 500)
  }
}
