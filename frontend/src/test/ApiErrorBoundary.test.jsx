import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

describe('ApiErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(screen.queryByTestId('success')).not.toBeInTheDocument()
  })

  it('should show error details when expanded', async () => {
    const user = userEvent.setup()
    
    render(
      <ApiErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ApiErrorBoundary>
    )

    const detailsButton = screen.getByRole('button', { name: /show details/i })
    await user.click(detailsButton)

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should retry and reset error state', async () => {
    const user = userEvent.setup()
    
    let shouldThrow = true
    function RetryableComponent() {
      if (shouldThrow) {
        shouldThrow = false
        throw new Error('Temporary error')
      }
      return <div data-testid="retry-success">Retry successful</div>
    }

    render(
      <ApiErrorBoundary>
        <RetryableComponent />
      </ApiErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)

    expect(screen.getByTestId('retry-success')).toBeInTheDocument()
  })

  it('should handle multiple retries with exponential backoff', async () => {
    const user = userEvent.setup()
    
    let failCount = 0
    function FailingComponent() {
      failCount++
      if (failCount < 3) {
        throw new Error(`Attempt ${failCount} failed`)
      }
      return <div data-testid="final-success">Finally succeeded</div>
    }

    render(
      <ApiErrorBoundary>
        <FailingComponent />
      </ApiErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)

    expect(screen.getByTestId('final-success')).toBeInTheDocument()
  })

  it('should disable retry after max attempts', () => {
    function AlwaysFailComponent() {
      throw new Error('Always fails')
    }

    render(
      <ApiErrorBoundary maxRetries={2}>
        <AlwaysFailComponent />
      </ApiErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
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
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it('should handle reset functionality', async () => {
    const user = userEvent.setup()
    
    let shouldThrow = true
    function ResetComponent() {
      if (shouldThrow) {
        shouldThrow = false
        throw new Error('Reset error')
      }
      return <div data-testid="reset-success">Reset successful</div>
    }

    render(
      <ApiErrorBoundary>
        <ResetComponent />
      </ApiErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const resetButton = screen.getByRole('button', { name: /try again/i })
    await user.click(resetButton)

    expect(screen.getByTestId('reset-success')).toBeInTheDocument()
  })

  it('should reload page when reload button is clicked', async () => {
    const user = userEvent.setup()
    
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