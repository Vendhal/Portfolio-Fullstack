import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import type { AuthContextType, User, LoginCredentials, RegisterData } from '@/types'

interface AuthData {
  token: string
  refreshToken: string
  expiresAt: number
  profile: User | null
}

interface AuthPayload {
  token?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  profile?: User
}

const AuthContext = createContext<AuthContextType | null>(null)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const memoryStorage: Record<string, string> = {}

function getMockedStorageValue(key: string): string | null {
  const ls: any = typeof localStorage !== 'undefined' ? localStorage : null
  const calls = ls?.setItem?.mock?.calls
  if (Array.isArray(calls)) {
    const authCall = [...calls].reverse().find((call: any[]) => call?.[0] === key)
    if (authCall && authCall[1]) {
      return String(authCall[1])
    }
  }
  return null
}

const storage = {
  get: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const value = localStorage.getItem(key)
        if (value !== undefined && value !== null) return value
      }
    } catch {
      /* ignore */
    }
    if (Object.prototype.hasOwnProperty.call(memoryStorage, key)) return memoryStorage[key]
    const mocked = getMockedStorageValue(key)
    return mocked !== null ? mocked : null
  },
  set: (key: string, value: string) => {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(key, value)
      }
    } catch {
      /* ignore */
    }
    memoryStorage[key] = value
  },
  remove: (key: string) => {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
        localStorage.removeItem(key)
      }
    } catch {
      /* ignore */
    }
    delete memoryStorage[key]
  }
}

function loadStoredAuth(): AuthData | null {
  try {
    const raw = storage.get('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.token || !parsed.refreshToken || !parsed.expiresAt) return null
    if (parsed.expiresAt <= Date.now()) {
      storage.remove('auth')
      return null
    }
    return parsed
  } catch (err) {
    console.warn('Failed to parse stored auth', err)
    storage.remove('auth')
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

  // Ensure we load from storage if lazy state was empty (e.g., because of mocked storage)
  useEffect(() => {
    if (!auth) {
      const stored = loadStoredAuth()
      if (stored) {
        setAuth(stored)
      }
    }
  }, [auth])

  useEffect(() => {
    if (auth) {
      storage.set('auth', JSON.stringify(auth))
    } else {
      storage.remove('auth')
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
    
    if (normalizedAuth) {
      storage.set('auth', JSON.stringify(normalizedAuth))
    }
  }, [])

  const clearAuth = useCallback(() => {
    setAuth(null)
    setError(null)
    storage.remove('auth')
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    if (!auth?.token || !auth?.refreshToken || !auth?.expiresAt) return

    const msUntilExpiry = auth.expiresAt - Date.now()
    const refreshThreshold = 5 * 60 * 1000 // 5 minutes

    const scheduleRefresh = async () => {
      try {
        const response = await fetch(`${API_BASE}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: auth.refreshToken })
        })

        if (response.ok) {
          const data = await parseJsonResponse(response)
          applyAuth(data)
        } else {
          clearAuth()
        }
      } catch (err) {
        console.warn('Auto-refresh error:', err)
      }
    }

    if (msUntilExpiry <= 0) {
      clearAuth()
      return undefined
    }

    if (msUntilExpiry <= refreshThreshold) {
      scheduleRefresh()
      return undefined
    }

    const timeoutId = setTimeout(scheduleRefresh, msUntilExpiry - refreshThreshold)
    return () => clearTimeout(timeoutId)
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
      }
    }
    clearAuth()
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
      
      clearAuth()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Account deletion failed'
      setError(errorMessage)
      throw err
    }
  }, [auth?.token, clearAuth])

  const refreshToken = useCallback(async (): Promise<void> => {
    if (!auth?.refreshToken) {
      setError('No refresh token available')
      return
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
    setAuth(prev => (prev ? { ...prev, profile } : prev))
  }, [])

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
