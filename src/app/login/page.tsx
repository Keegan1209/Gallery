'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/')
      } else {
        setError(data.error || 'Invalid email or password')
      }
    } catch (error) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'Helvetica, Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 'normal',
            color: '#000000',
            margin: '0 0 10px 0',
            letterSpacing: '0.5px'
          }}>
            LILLY & KEEGAN
          </h1>
          <div style={{
            fontSize: '18px',
            fontWeight: 'normal',
            color: '#000000',
            letterSpacing: '0.5px'
          }}>
            VISUAL DIARY
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#000000',
                backgroundColor: '#ffffff',
                border: '1px solid #000000',
                outline: 'none',
                letterSpacing: '0.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '30px' }}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#000000',
                backgroundColor: '#ffffff',
                border: '1px solid #000000',
                outline: 'none',
                letterSpacing: '0.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              fontSize: '12px',
              color: '#cc0000',
              textAlign: 'center',
              marginBottom: '20px',
              letterSpacing: '0.5px'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '12px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 'normal',
              color: '#ffffff',
              backgroundColor: '#000000',
              border: '1px solid #000000',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  )
}