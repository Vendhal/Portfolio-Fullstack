import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../state/AuthContext'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test component to use the AuthContext
function TestComponent() {
  const { 
    authState, 
    login, 
    logout, 
    refreshToken,
    register 
  } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {authState.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-token">
        {authState.token || 'no-token'}
      </div>
      <div data-testid="user-profile">
        {authState.user?.name || authState.user?.displayName || 'no-profile'}
      </div>
      <button 
        data-testid="login-btn" 
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button 
        data-testid="logout-btn" 
        onClick={logout}
      >
        Logout
      </button>
      <button 
        data-testid="refresh-btn" 
        onClick={refreshToken}
      >
        Refresh
      </button>
      <button 
        data-testid="register-btn" 
        onClick={() => register({
          email: 'new@example.com',
          password: 'password',
          name: 'New User'
        })}
      >
        Register
      </button>
    </div>
  )
}

function renderWithAuthProvider(component) {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with no authentication', () => {
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user-token')).toHaveTextContent('no-token')
    expect(screen.getByTestId('user-profile')).toHaveTextContent('no-profile')
  })

  it('should load stored authentication on initialization', () => {
    const futureTime = Date.now() + 3600000 // 1 hour from now
    const storedAuth = {
      token: 'stored-token',
      refreshToken: 'stored-refresh',
      expiresAt: futureTime,
      profile: { name: 'Stored User' }
    }
    
    localStorage.setItem('auth', JSON.stringify(storedAuth))
    
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user-token')).toHaveTextContent('stored-token')
    expect(screen.getByTestId('user-profile')).toHaveTextContent('Stored User')
  })

  it('should remove expired stored authentication', () => {
    const pastTime = Date.now() - 3600000 // 1 hour ago
    const expiredAuth = {
      token: 'expired-token',
      refreshToken: 'expired-refresh',
      expiresAt: pastTime,
      profile: { name: 'Expired User' }
    }
    
    localStorage.setItem('auth', JSON.stringify(expiredAuth))
    
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(localStorage.getItem('auth')).toBeNull()
  })

  it('should handle successful login', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const mockResponse = {
      token: 'new-token',
      refreshToken: 'new-refresh',
      expiresAt: Date.now() + 3600000,
      profile: { name: 'Test User' }
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    })
    
    renderWithAuthProvider(<TestComponent />)
    
    await user.click(screen.getByTestId('login-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    }, { timeout: 1000 })
    
    expect(screen.getByTestId('user-token')).toHaveTextContent('new-token')
    expect(screen.getByTestId('user-profile')).toHaveTextContent('Test User')
    
    // Check localStorage
    const storedAuth = JSON.parse(localStorage.getItem('auth'))
    expect(storedAuth.token).toBe('new-token')
  }, 10000)

  it('should handle login failure', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ message: 'Invalid credentials' }))
    })
    
    renderWithAuthProvider(<TestComponent />)
    
    // The login function should catch and set error
    await user.click(screen.getByTestId('login-btn'))
    
    // Wait a bit and check that we're still not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    }, { timeout: 1000 })
  }, 10000)

  it('should handle logout and call backend', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    // Set up initial auth state
    const initialAuth = {
      token: 'test-token',
      refreshToken: 'test-refresh',
      expiresAt: Date.now() + 3600000,
      profile: { name: 'Test User' }
    }
    localStorage.setItem('auth', JSON.stringify(initialAuth))
    
    // Mock logout API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('')
    })
    
    // Mock window.location.href assignment
    const originalLocation = window.location
    delete window.location
    window.location = { ...originalLocation, href: '' }
    
    renderWithAuthProvider(<TestComponent />)
    
    // Verify initial authenticated state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    
    await user.click(screen.getByTestId('logout-btn'))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      }))
    }, { timeout: 1000 })
    
    // Restore window.location
    window.location = originalLocation
  }, 10000)

  it('should handle token refresh', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    // Set up initial auth state
    const initialAuth = {
      token: 'old-token',
      refreshToken: 'old-refresh',
      expiresAt: Date.now() + 3600000,
      profile: { name: 'Test User' }
    }
    localStorage.setItem('auth', JSON.stringify(initialAuth))
    
    const refreshResponse = {
      token: 'new-refreshed-token',
      refreshToken: 'new-refresh-token',
      expiresAt: Date.now() + 7200000, // 2 hours
      profile: { name: 'Test User' }
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(refreshResponse))
    })
    
    renderWithAuthProvider(<TestComponent />)
    
    await user.click(screen.getByTestId('refresh-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('user-token')).toHaveTextContent('new-refreshed-token')
    }, { timeout: 1000 })
    
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/refresh', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ refreshToken: 'old-refresh' })
    }))
  }, 10000)

  it('should automatically refresh token before expiry', async () => {
    const now = Date.now()
    const expiresAt = now + 4 * 60 * 1000 // 4 minutes from now (less than 5-minute threshold)
    
    const initialAuth = {
      token: 'expiring-token',
      refreshToken: 'expiring-refresh',
      expiresAt,
      profile: { name: 'Test User' }
    }
    
    const refreshResponse = {
      token: 'auto-refreshed-token',
      refreshToken: 'auto-refreshed-refresh',
      expiresAt: now + 3600000, // 1 hour from now
      profile: { name: 'Test User' }
    }
    
    // Mock the auto-refresh API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(refreshResponse))
    })
    
    localStorage.setItem('auth', JSON.stringify(initialAuth))
    
    renderWithAuthProvider(<TestComponent />)
    
    // Fast-forward time to trigger auto-refresh (4 minutes = not triggering, needs 6+ minutes)
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000) // 10 minutes to be sure
    })
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/refresh', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ refreshToken: 'expiring-refresh' })
      }))
    }, { timeout: 1000 })
  }, 10000)

  it('should handle registration', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    const mockResponse = {
      token: 'registration-token',
      refreshToken: 'registration-refresh',
      expiresAt: Date.now() + 3600000,
      profile: { name: 'New User' }
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    })
    
    renderWithAuthProvider(<TestComponent />)
    
    await user.click(screen.getByTestId('register-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    }, { timeout: 1000 })
    
    expect(screen.getByTestId('user-profile')).toHaveTextContent('New User')
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/register', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'password',
        name: 'New User'
      })
    }))
  }, 10000)

  it('should handle malformed stored auth data', () => {
    localStorage.setItem('auth', 'invalid-json')
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored auth', expect.any(Error))
    
    consoleSpy.mockRestore()
  })
})