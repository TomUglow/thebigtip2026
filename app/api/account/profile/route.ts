import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  postcode: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    console.log('Profile GET session:', session)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email?.toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email },
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile - Full error:', error)
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Profile PATCH session:', session)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Profile PATCH body:', body)

    // Validate input
    const data = updateProfileSchema.parse(body)

    // Check if new email/username already exists
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      })
      if (existingEmail && existingEmail.email !== session.user.email) {
        return NextResponse.json({ error: 'Email already taken' }, { status: 409 })
      }
    }

    if (data.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username.toLowerCase() },
      })
      if (existingUsername && existingUsername.username !== (session.user as any).username) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
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
      where: { email: session.user.email.toLowerCase() },
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

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating profile:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
