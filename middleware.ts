import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login', '/register', '/']
const protectedRoutes = ['/dashboard', '/lobby', '/account']

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const pathname = request.nextUrl.pathname

  // If user has a valid token (is authenticated)
  if (token) {
    // Redirect away from login/register pages to dashboard
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect root "/" to dashboard for authenticated users
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Allow authenticated user to access other routes
    return NextResponse.next()
  }

  // If user is NOT authenticated
  if (!token) {
    // If trying to access protected routes, redirect to login
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/account') || pathname.startsWith('/lobby')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow unauthenticated users to access public routes (/, /login, /register)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Match all routes except static assets, api routes, and next internals
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif).*)',
  ],
}
