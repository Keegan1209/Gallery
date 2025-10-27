import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Authenticate with Supabase
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

        // Create JWT token for our app
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

        // Create response with cookie
        const response = NextResponse.json({ 
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email
            }
        })
        
        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
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