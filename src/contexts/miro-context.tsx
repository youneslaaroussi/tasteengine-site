'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface MiroUser {
  id: string
  name: string
  email: string
  team_id: string
}

interface MiroContextType {
  isAuthenticated: boolean
  user: MiroUser | null
  isLoading: boolean
  signIn: () => void
  signOut: () => void
  checkAuthStatus: () => Promise<void>
}

const MiroContext = createContext<MiroContextType | null>(null)

interface MiroProviderProps {
  children: ReactNode
}

export function MiroProvider({ children }: MiroProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<MiroUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/miro/auth/status')
      const data = await response.json()
      
      if (data.authenticated) {
        setIsAuthenticated(true)
        setUser(data.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking Miro auth status:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = () => {
    const clientId = process.env.NEXT_PUBLIC_MIRO_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/miro/callback`
    const authUrl = `https://miro.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=boards:read%20boards:write`
    
    window.location.href = authUrl
  }

  const signOut = async () => {
    try {
      await fetch('/api/miro/auth/signout', { method: 'POST' })
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value: MiroContextType = {
    isAuthenticated,
    user,
    isLoading,
    signIn,
    signOut,
    checkAuthStatus,
  }

  return (
    <MiroContext.Provider value={value}>
      {children}
    </MiroContext.Provider>
  )
}

export function useMiro() {
  const context = useContext(MiroContext)
  if (!context) {
    throw new Error('useMiro must be used within a MiroProvider')
  }
  return context
} 