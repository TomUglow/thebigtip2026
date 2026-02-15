import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  mobile: z.string().optional(),
  postcode: z.string().optional(),
  favoriteTeams: z.array(z.object({ sport: z.string(), team: z.string() })).optional(),
})

type RegisterInput = z.infer<typeof registerSchema>

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    let data: RegisterInput
    try {
      data = registerSchema.parse(body)
    } catch (validationError: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError.errors },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase() },
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user with favorite teams in transaction
    const user = await prisma.user.create({
      data: {
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name || null,
        mobile: data.mobile || null,
        postcode: data.postcode || null,
        // Create favorite teams if provided
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

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong', detail: error?.message || String(error) },
      { status: 500 }
    )
  }
}

