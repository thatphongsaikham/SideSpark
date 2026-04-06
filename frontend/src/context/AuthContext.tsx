'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Session } from 'next-auth'
import { signIn, signOut, useSession } from 'next-auth/react'

interface AuthContextType {
  user: Session['user'] | null
  loading: boolean
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const user = session?.user || null

  // Extract and store access token from session
  useEffect(() => {
    if (session?.accessToken) {
      setAccessToken(session.accessToken)
      // Also store in session storage for API client
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('next-auth.session-token', JSON.stringify(session))
      }
    } else {
      setAccessToken(null)
    }
  }, [session])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut()
      setAccessToken(null)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('next-auth.session-token')
      }
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || status === 'loading',
        accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
