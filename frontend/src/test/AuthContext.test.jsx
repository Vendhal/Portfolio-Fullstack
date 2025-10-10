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
    auth, 
    isAuthenticated, 
    login, 
    logout, 
    refreshToken,
    register 
  } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-token">
        {auth?.token || 'no-token'}
      </div>
      <div data-testid="user-profile">
        {auth?.profile?.name || 'no-profile'}
      </div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('test@example.com', 'password')}
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
      expiresAt: pastTime,
      profile: { name: 'Expired User' }
    }
    
    localStorage.setItem('auth', JSON.stringify(expiredAuth))
    
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(localStorage.getItem('auth')).toBeNull()
  })

  it('should handle successful login', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      token: 'new-token',
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
    })
    
    expect(screen.getByTestId('user-token')).toHaveTextContent('new-token')
    expect(screen.getByTestId('user-profile')).toHaveTextContent('Test User')
    
    // Check localStorage
    const storedAuth = JSON.parse(localStorage.getItem('auth'))
    expect(storedAuth.token).toBe('new-token')
  })

  it('should handle login failure', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ message: 'Invalid credentials' }))
    })
    
    renderWithAuthProvider(<TestComponent />)
    
    // Login should throw an error
    await expect(async () => {
      await user.click(screen.getByTestId('login-btn'))
    }).rejects.toThrow()
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
  })

  it('should handle logout and call backend', async () => {
    const user = userEvent.setup()
    
    // Set up initial auth state
    const initialAuth = {
      token: 'test-token',
      expiresAt: Date.now() + 3600000,
      profile: { name: 'Test User' }
    }
    localStorage.setItem('auth', JSON.stringify(initialAuth))
    
    // Mock logout API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('')
    })
    
    renderWithAuthProvider(<TestComponent />)
    
    // Verify initial authenticated state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    
    await user.click(screen.getByTestId('logout-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })
    
    expect(localStorage.getItem('auth')).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token'
      })
    }))
  })

  it('should handle token refresh', async () => {
    const user = userEvent.setup()
    
    // Set up initial auth state
    const initialAuth = {
      token: 'old-token',
      expiresAt: Date.now() + 3600000,
      profile: { name: 'Test User' }
    }
    localStorage.setItem('auth', JSON.stringify(initialAuth))
    
    const refreshResponse = {
      token: 'new-refreshed-token',
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
    })
    
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer old-token'
      })
    }))
  })

  it('should automatically refresh token before expiry', async () => {
    const now = Date.now()
    const expiresAt = now + 4 * 60 * 1000 // 4 minutes from now (less than 5-minute threshold)
    
    const initialAuth = {
      token: 'expiring-token',
      expiresAt,
      profile: { name: 'Test User' }
    }
    
    const refreshResponse = {
      token: 'auto-refreshed-token',
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
    
    // Fast-forward time to trigger auto-refresh
    act(() => {
      vi.advanceTimersByTime(1000) // Small delay to trigger the effect
    })
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer expiring-token'
        })
      }))
    })
  })

  it('should handle registration', async () => {
    const user = userEvent.setup()
    
    const mockResponse = {
      token: 'registration-token',
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
    })
    
    expect(screen.getByTestId('user-profile')).toHaveTextContent('New User')
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
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
  })

  it('should handle malformed stored auth data', () => {
    localStorage.setItem('auth', 'invalid-json')
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored auth', expect.any(Error))
    
    consoleSpy.mockRestore()
  })
})