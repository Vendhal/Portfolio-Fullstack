import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import type { AuthContextType, User, LoginCredentials, RegisterData } from '@/types'

interface AuthData {
  token: string;
  refreshToken: string;
  expiresAt: number;
  profile: User | null;
}

interface AuthPayload {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  profile?: User;
}

const AuthContext = createContext<AuthContextType | null>(null)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function loadStoredAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.token || !parsed.refreshToken || !parsed.expiresAt) return null
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem('auth')
      return null
    }
    return parsed
  } catch (err) {
    console.warn('Failed to parse stored auth', err)
    return null
  }
}

function normaliseAuthPayload(payload: AuthPayload | null): AuthData | null {
  if (!payload) return null
  return {
    token: payload.token || payload.accessToken || '',
    refreshToken: payload.refreshToken || '',
    expiresAt: payload.expiresAt || 0,
    profile: payload.profile || null,
  }
}

async function parseJsonResponse(response: Response): Promise<any> {
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.warn('Failed to parse response JSON', err)
    }
  }
  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'Request failed'
    const error = new Error(message) as Error & { status: number; payload: any }
    error.status = response.status
    error.payload = data
    throw error
  }
  return data
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<AuthData | null>(() => loadStoredAuth())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (auth) {
      localStorage.setItem('auth', JSON.stringify(auth))
    } else {
      localStorage.removeItem('auth')
    }
  }, [auth])

  useEffect(() => {
    if (auth?.expiresAt && auth.expiresAt <= Date.now()) {
      setAuth(null)
    }
  }, [auth?.expiresAt])

  const applyAuth = useCallback((payload: AuthPayload) => {
    const normalizedAuth = normaliseAuthPayload(payload)
    setAuth(normalizedAuth)
    setError(null)
    
    // Store in localStorage
    if (normalizedAuth) {
      localStorage.setItem('auth', JSON.stringify(normalizedAuth))
    }
  }, [])

  const clearAuth = useCallback(() => {
    setAuth(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!auth?.token || !auth?.refreshToken || !auth?.expiresAt) return

    const msUntilExpiry = auth.expiresAt - Date.now()
    const refreshThreshold = 5 * 60 * 1000 // 5 minutes before expiry

    if (msUntilExpiry > refreshThreshold) {
      const timeoutId = setTimeout(async () => {
        try {
          console.log('Auto-refreshing JWT token...')
          const response = await fetch(`${API_BASE}/v1/auth/refresh`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken: auth.refreshToken })
          })
          
          if (response.ok) {
            const data = await parseJsonResponse(response)
            console.log('JWT token auto-refreshed successfully')
            applyAuth(data)
          } else {
            console.warn('Auto-refresh failed, user will need to re-login')
            clearAuth()
          }
        } catch (err) {
          console.warn('Auto-refresh error:', err)
          // Don't clear auth immediately on network error, let user continue until hard expiry
        }
      }, msUntilExpiry - refreshThreshold)

      return () => clearTimeout(timeoutId)
    }
    
    return undefined
  }, [auth?.token, auth?.refreshToken, auth?.expiresAt, applyAuth, clearAuth])

  const postCredentials = useCallback(async (path: string, body: any): Promise<any> => {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return parseJsonResponse(res)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setError(null)
      const data = await postCredentials('/v1/auth/login', credentials)
      applyAuth(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    }
  }, [applyAuth, postCredentials])

  const register = useCallback(async (form: RegisterData): Promise<void> => {
    try {
      setError(null)
      const data = await postCredentials('/v1/auth/register', form)
      applyAuth(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    }
  }, [applyAuth, postCredentials])

  const logout = useCallback(async (): Promise<void> => {
    // Call backend logout to invalidate refresh token
    if (auth?.token) {
      try {
        await fetch(API_BASE + '/v1/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (err) {
        console.warn('Logout API call failed:', err)
        // Continue with local logout even if API call fails
      }
    }
    clearAuth()
    // Use window.location to navigate after logout
    window.location.href = '/'
  }, [auth?.token, clearAuth])

  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!auth?.token) {
      throw new Error('No authentication token')
    }
    
    try {
      setError(null)
      const response = await fetch(API_BASE + '/v1/auth/delete-account', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete account')
      }
      
      // Clear local auth data after successful deletion
      clearAuth()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Account deletion failed'
      setError(errorMessage)
      throw err
    }
  }, [auth?.token, clearAuth])

  const refreshToken = useCallback(async (): Promise<void> => {
    if (!auth?.refreshToken) {
      throw new Error('No refresh token available')
    }
    
    try {
      setError(null)
      const response = await fetch(API_BASE + '/v1/auth/refresh', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: auth.refreshToken })
      })
      
      if (!response.ok) {
        clearAuth()
        throw new Error('Token refresh failed')
      }
      
      const data = await parseJsonResponse(response)
      applyAuth(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token refresh failed'
      setError(errorMessage)
      clearAuth()
      throw err
    }
  }, [auth?.refreshToken, applyAuth, clearAuth])

  const authorizedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!auth?.token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(API_BASE + '/v1' + url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return response
  }, [auth?.token])

  const setProfileSummary = useCallback((profile: any) => {
    if (auth) {
      setAuth({
        ...auth,
        profile
      })
    }
  }, [auth])

  const authState = useMemo(() => ({
    user: auth?.profile || null,
    token: auth?.token || null,
    isAuthenticated: Boolean(auth?.token),
    isLoading: false,
    error,
  }), [auth?.profile, auth?.token, error])

  const value: AuthContextType = useMemo(() => ({
    authState,
    login,
    register,
    logout,
    deleteAccount,
    refreshToken,
    clearError,
    authorizedFetch,
    setProfileSummary,
  }), [authState, login, register, logout, deleteAccount, refreshToken, clearError, authorizedFetch, setProfileSummary])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
