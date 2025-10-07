import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.token || !parsed.expiresAt) return null
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

function normaliseAuthPayload(payload) {
  if (!payload) return null
  return {
    token: payload.token,
    expiresAt: payload.expiresAt,
    profile: payload.profile || null,
  }
}

async function parseJsonResponse(response) {
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
    const error = new Error(message)
    error.status = response.status
    error.payload = data
    throw error
  }
  return data
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadStoredAuth())

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
  }, [])

  const applyAuth = useCallback((payload) => {
    setAuth(normaliseAuthPayload(payload))
  }, [])

  const clearAuth = useCallback(() => {
    setAuth(null)
  }, [])

  const postCredentials = useCallback(async (path, body) => {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return parseJsonResponse(res)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await postCredentials('/auth/login', { email, password })
    applyAuth(data)
    return data
  }, [applyAuth, postCredentials])

  const register = useCallback(async (form) => {
    const data = await postCredentials('/auth/register', form)
    applyAuth(data)
    return data
  }, [applyAuth, postCredentials])

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  const authorizedFetch = useCallback((path, options = {}) => {
    if (!auth?.token) {
      const error = new Error('Authentication required')
      error.status = 401
      throw error
    }
    const headers = new Headers(options.headers || {})
    headers.set('Authorization', `Bearer ${auth.token}`)
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    return fetch(API_BASE + path, { ...options, headers })
  }, [auth])

  const refreshProfile = useCallback(async () => {
    if (!auth?.token) {
      throw new Error('Not authenticated')
    }
    const res = await authorizedFetch('/profile/me')
    if (res.status === 401) {
      clearAuth()
      throw new Error('Session expired')
    }
    const data = await parseJsonResponse(res)
    setAuth(prev => prev ? { ...prev, profile: data?.profile || null } : prev)
    return data
  }, [auth, authorizedFetch, clearAuth])

  const setProfileSummary = useCallback((profile) => {
    setAuth(prev => prev ? { ...prev, profile } : prev)
  }, [])

  const value = useMemo(() => ({
    auth,
    isAuthenticated: Boolean(auth?.token),
    login,
    register,
    logout,
    authorizedFetch,
    refreshProfile,
    setProfileSummary,
  }), [auth, authorizedFetch, login, logout, refreshProfile, register, setProfileSummary])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
