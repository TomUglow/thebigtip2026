import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normaliseMobile } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const mobile = request.nextUrl.searchParams.get('mobile')

    if (!mobile) {
      return NextResponse.json(
        { error: 'Mobile is required' },
        { status: 400 }
      )
    }

    const normalised = normaliseMobile(mobile)

    // Validate Australian mobile format
    if (!/^04\d{8}$/.test(normalised)) {
      return NextResponse.json(
        { available: false, reason: 'Enter a valid Australian mobile (04XXXXXXXX)' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { mobile: normalised },
    })

    return NextResponse.json({
      available: !existingUser,
    })
  } catch (error) {
    console.error('Error checking mobile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
