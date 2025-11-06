import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

// Initialize Supabase client for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Login API Route
 * 
 * Handles user authentication using Supabase Auth.
 * Creates a JWT session token and sets it as an HTTP-only cookie.
 */
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Authenticate user with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error || !data.user) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Create JWT session token for our application
        const sessionSecret = process.env.SESSION_SECRET || "03df54b0b8cdb05b14bdfb75b18609ca89f3df0320985da126477f000b113a31"
        const secret = new TextEncoder().encode(sessionSecret)
        const token = await new SignJWT({ 
            userId: data.user.id,
            email: data.user.email,
            admin: true 
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret)

        // Create successful response
        const response = NextResponse.json({ 
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email
            }
        })
        
        // Set JWT token as HTTP-only cookie for security
        response.cookies.set('session', token, {
            httpOnly: true, // Prevents JavaScript access (XSS protection)
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax', // CSRF protection
            maxAge: 60 * 60 * 24, // 24 hours expiration
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}