'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setAuthToken, clearAuthToken } from './api'

interface User {
  id: string
  email: string
  name: string
  role?: string
  balance: number
  created_at: string
  api_key?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedApiKey = localStorage.getItem('apiKey')
    if (savedUser && savedApiKey) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.auth.login(email, password)
      if (response.id) {
        setUser(response)
        setIsAuthenticated(true)
        localStorage.setItem('user', JSON.stringify(response))
        
        if (response.api_key) {
          setAuthToken(response.api_key)
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    clearAuthToken()
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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
