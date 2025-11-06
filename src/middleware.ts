import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Authentication Middleware
 * 
 * This middleware runs on every request and protects all pages except login.
 * It checks for a valid JWT session token and redirects to login if not found.
 */
export async function middleware(request: NextRequest) {
  // Skip authentication check for login page and auth API routes
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next()
  }

  // Get the session token from HTTP-only cookies
  const token = request.cookies.get('session')?.value

  // No token found - redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify the JWT token is valid and not expired
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'fallback-secret')
    await jwtVerify(token, secret)
    
    // Token is valid - allow access to the requested page
    return NextResponse.next()
  } catch (error) {
    // Token is invalid or expired - redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}