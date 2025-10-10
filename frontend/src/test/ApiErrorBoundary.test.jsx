import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApiErrorBoundary from '../components/ApiErrorBoundary'

// Component that throws an error for testing
function ThrowError({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div data-testid="success">No error</div>
}

// Component with async error
function AsyncError({ shouldThrow }) {
  if (shouldThrow) {
    Promise.reject(new Error('Async error'))
  }
  return <div data-testid="async-success">No async error</div>
}

describe('ApiErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore?.()
  })

  it('should render children when there is no error', () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ApiErrorBoundary>
    )

    expect(screen.getByTestId('success')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should catch and display error', () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ApiErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We encountered an error while loading data/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByTestId('success')).not.toBeInTheDocument()
  })

  it('should show error details when expanded', async () => {
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ApiErrorBoundary>
    )

    const detailsElement = screen.getByRole('group')
    expect(detailsElement).toBeInTheDocument()
    
    // Click to expand details
    const summary = screen.getByText('Error details')
    fireEvent.click(summary)
    
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument()
  })

  it('should retry and reset error state', async () => {
    const user = userEvent.setup()
    
    function TestComponent({ hasError }) {
      if (hasError) {
        throw new Error('Retry test error')
      }
      return <div data-testid="retry-success">Retry successful</div>
    }

    const { rerender } = render(
      <ApiErrorBoundary>
        <TestComponent hasError={true} />
      </ApiErrorBoundary>
    )

    // Verify error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()

    // Change the component to not throw error
    rerender(
      <ApiErrorBoundary>
        <TestComponent hasError={false} />
      </ApiErrorBoundary>
    )

    // Click retry
    await user.click(retryButton)

    // Should show success after retry
    await waitFor(() => {
      expect(screen.getByTestId('retry-success')).toBeInTheDocument()
    })
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should handle multiple retries with exponential backoff', async () => {
    const user = userEvent.setup()
    vi.useFakeTimers()

    function FailingComponent({ attemptCount }) {
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`)
      }
      return <div data-testid="final-success">Finally succeeded</div>
    }

    let attemptCount = 1
    const { rerender } = render(
      <ApiErrorBoundary>
        <FailingComponent attemptCount={attemptCount} />
      </ApiErrorBoundary>
    )

    // First retry
    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)
    
    // Wait for the backoff delay
    vi.advanceTimersByTime(1000) // 2^0 * 1000 = 1000ms
    
    attemptCount = 2
    rerender(
      <ApiErrorBoundary>
        <FailingComponent attemptCount={attemptCount} />
      </ApiErrorBoundary>
    )

    // Second retry (should show "2 left")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again \(2 left\)/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /try again \(2 left\)/i }))
    vi.advanceTimersByTime(2000) // 2^1 * 1000 = 2000ms
    
    attemptCount = 3
    rerender(
      <ApiErrorBoundary>
        <FailingComponent attemptCount={attemptCount} />
      </ApiErrorBoundary>
    )

    // Third retry (should show "1 left")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again \(1 left\)/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /try again \(1 left\)/i }))
    vi.advanceTimersByTime(4000) // 2^2 * 1000 = 4000ms

    // Should succeed on the final attempt
    await waitFor(() => {
      expect(screen.getByTestId('final-success')).toBeInTheDocument()
    })

    vi.useRealTimers()
  })

  it('should disable retry after max attempts', async () => {
    const user = userEvent.setup()
    vi.useFakeTimers()

    function AlwaysFailingComponent() {
      throw new Error('Always fails')
    }

    render(
      <ApiErrorBoundary>
        <AlwaysFailingComponent />
      </ApiErrorBoundary>
    )

    // Exhaust all retries
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)
      vi.advanceTimersByTime(Math.pow(2, i) * 1000)
      
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      })
    }

    // After 3 attempts, retry should be disabled
    expect(screen.getByText(/Maximum retries reached/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should call onError prop when error occurs', () => {
    const onErrorMock = vi.fn()

    render(
      <ApiErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ApiErrorBoundary>
    )

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('should handle reset functionality', async () => {
    const user = userEvent.setup()

    function ConditionalError({ shouldError }) {
      if (shouldError) {
        throw new Error('Reset test error')
      }
      return <div data-testid="reset-success">Reset successful</div>
    }

    const { rerender } = render(
      <ApiErrorBoundary>
        <ConditionalError shouldError={true} />
      </ApiErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Change component to not error
    rerender(
      <ApiErrorBoundary>
        <ConditionalError shouldError={false} />
      </ApiErrorBoundary>
    )

    // Click reset
    const resetButton = screen.getByRole('button', { name: /reset/i })
    await user.click(resetButton)

    await waitFor(() => {
      expect(screen.getByTestId('reset-success')).toBeInTheDocument()
    })
  })

  it('should reload page when reload button is clicked', async () => {
    const user = userEvent.setup()
    
    // Mock window.location.reload
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    })

    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ApiErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: /reload page/i })
    await user.click(reloadButton)

    expect(reloadMock).toHaveBeenCalled()
  })
})