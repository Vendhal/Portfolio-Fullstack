import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'import { describe, it, expect, vi, beforeEach } from 'vitest'

import { render, screen, waitFor } from '@testing-library/react'

import userEvent from '@testing-library/user-event'import { render, screen, waitFor } from '@testing-library/react'import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import ApiErrorBoundary from '../components/ApiErrorBoundary'

import userEvent from '@testing-library/user-event'import userEvent from '@testing-library/user-event'

// Component that throws an error for testing

function ThrowError({ shouldThrow }) {import ApiErrorBoundary from '../components/ApiErrorBoundary'import ApiErrorBoundary from '../components/ApiErrorBoundary'

  if (shouldThrow) {

    throw new Error('Test error message')

  }

  return <div data-testid="success">No error</div>// Component that throws an error for testing// Component that throws an error for testing

}

function ThrowError({ shouldThrow }) {function ThrowError({ shouldThrow }) {

describe('ApiErrorBoundary', () => {

  beforeEach(() => {  if (shouldThrow) {  if (shouldThrow) {

    vi.clearAllMocks()

    vi.spyOn(console, 'error').mockImplementation(() => {})    throw new Error('Test error message')    throw new Error('Test error message')

  })

  }  }

  afterEach(() => {

    console.error.mockRestore?.()  return <div data-testid="success">No error</div>  return <div data-testid="success">No error</div>

  })

}}

  it('should render children when there is no error', () => {

    render(

      <ApiErrorBoundary>

        <ThrowError shouldThrow={false} />describe('ApiErrorBoundary', () => {// Component with async error

      </ApiErrorBoundary>

    )  beforeEach(() => {function AsyncError({ shouldThrow }) {



    expect(screen.getByTestId('success')).toBeInTheDocument()    vi.clearAllMocks()  if (shouldThrow) {

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

  })    // Suppress console.error for cleaner test output    Promise.reject(new Error('Async error'))



  it('should catch and display error', () => {    vi.spyOn(console, 'error').mockImplementation(() => {})  }

    render(

      <ApiErrorBoundary>  })  return <div data-testid="async-success">No async error</div>

        <ThrowError shouldThrow={true} />

      </ApiErrorBoundary>}

    )

  afterEach(() => {

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    expect(screen.queryByTestId('success')).not.toBeInTheDocument()    console.error.mockRestore?.()describe('ApiErrorBoundary', () => {

  })

  })  beforeEach(() => {

  it('should show error details when expanded', async () => {

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })    vi.clearAllMocks()

    

    render(  it('should render children when there is no error', () => {    // Suppress console.error for cleaner test output

      <ApiErrorBoundary>

        <ThrowError shouldThrow={true} />    render(    vi.spyOn(console, 'error').mockImplementation(() => {})

      </ApiErrorBoundary>

    )      <ApiErrorBoundary>  })



    const detailsButton = screen.getByRole('button', { name: /show details/i })        <ThrowError shouldThrow={false} />

    await user.click(detailsButton)

      </ApiErrorBoundary>  afterEach(() => {

    expect(screen.getByText('Test error message')).toBeInTheDocument()

  }, 10000)    )    console.error.mockRestore?.()



  it('should retry and reset error state', async () => {  })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

        expect(screen.getByTestId('success')).toBeInTheDocument()

    let shouldThrow = true

    function RetryableComponent() {    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()  it('should render children when there is no error', () => {

      if (shouldThrow) {

        shouldThrow = false  })    render(

        throw new Error('Temporary error')

      }      <ApiErrorBoundary>

      return <div data-testid="retry-success">Retry successful</div>

    }  it('should catch and display error', () => {        <ThrowError shouldThrow={false} />



    render(    render(      </ApiErrorBoundary>

      <ApiErrorBoundary>

        <RetryableComponent />      <ApiErrorBoundary>    )

      </ApiErrorBoundary>

    )        <ThrowError shouldThrow={true} />



    expect(screen.getByText('Something went wrong')).toBeInTheDocument()      </ApiErrorBoundary>    expect(screen.getByTestId('success')).toBeInTheDocument()



    const retryButton = screen.getByRole('button', { name: /try again/i })    )    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

    await user.click(retryButton)

  })

    await waitFor(() => {

      expect(screen.getByTestId('retry-success')).toBeInTheDocument()    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    }, { timeout: 1000 })

  }, 10000)    expect(screen.queryByTestId('success')).not.toBeInTheDocument()  it('should catch and display error', () => {



  it('should handle multiple retries with exponential backoff', async () => {  })    render(

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      <ApiErrorBoundary>

    let failCount = 0

    function FailingComponent() {  it('should show error details when expanded', async () => {        <ThrowError shouldThrow={true} />

      failCount++

      if (failCount < 3) {    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })      </ApiErrorBoundary>

        throw new Error(`Attempt ${failCount} failed`)

      }        )

      return <div data-testid="final-success">Finally succeeded</div>

    }    render(



    render(      <ApiErrorBoundary>    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      <ApiErrorBoundary>

        <FailingComponent />        <ThrowError shouldThrow={true} />    expect(screen.getByText(/We encountered an error while loading data/)).toBeInTheDocument()

      </ApiErrorBoundary>

    )      </ApiErrorBoundary>    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()



    expect(screen.getByText('Something went wrong')).toBeInTheDocument()    )    expect(screen.queryByTestId('success')).not.toBeInTheDocument()

    

    const retryButton = screen.getByRole('button', { name: /try again/i })  })

    await user.click(retryButton)

        // Find and click the details button

    await waitFor(() => {

      expect(screen.getByTestId('final-success')).toBeInTheDocument()    const detailsButton = screen.getByRole('button', { name: /show details/i })  it('should show error details when expanded', async () => {

    }, { timeout: 1000 })

  }, 10000)    await user.click(detailsButton)    render(



  it('should disable retry after max attempts', async () => {      <ApiErrorBoundary>

    function AlwaysFailComponent() {

      throw new Error('Always fails')    expect(screen.getByText('Test error message')).toBeInTheDocument()        <ThrowError shouldThrow={true} />

    }

  }, 10000)      </ApiErrorBoundary>

    render(

      <ApiErrorBoundary maxRetries={2}>    )

        <AlwaysFailComponent />

      </ApiErrorBoundary>  it('should retry and reset error state', async () => {

    )

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })    const detailsElement = screen.getByRole('group')

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()        expect(detailsElement).toBeInTheDocument()

  }, 10000)

    let shouldThrow = true    

  it('should call onError prop when error occurs', () => {

    const onErrorMock = vi.fn()    function RetryableComponent() {    // Click to expand details

    

    render(      if (shouldThrow) {    const summary = screen.getByText('Error details')

      <ApiErrorBoundary onError={onErrorMock}>

        <ThrowError shouldThrow={true} />        shouldThrow = false // Next render won't throw    fireEvent.click(summary)

      </ApiErrorBoundary>

    )        throw new Error('Temporary error')    



    expect(onErrorMock).toHaveBeenCalledWith(      }    expect(screen.getByText('Error: Test error message')).toBeInTheDocument()

      expect.any(Error),

      expect.objectContaining({ componentStack: expect.any(String) })      return <div data-testid="retry-success">Retry successful</div>  })

    )

  })    }



  it('should handle reset functionality', async () => {  it('should retry and reset error state', async () => {

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

        render(    const user = userEvent.setup()

    let shouldThrow = true

    function ResetComponent() {      <ApiErrorBoundary>    

      if (shouldThrow) {

        shouldThrow = false        <RetryableComponent />    function TestComponent({ hasError }) {

        throw new Error('Reset error')

      }      </ApiErrorBoundary>      if (hasError) {

      return <div data-testid="reset-success">Reset successful</div>

    }    )        throw new Error('Retry test error')



    render(      }

      <ApiErrorBoundary>

        <ResetComponent />    // Should show error      return <div data-testid="retry-success">Retry successful</div>

      </ApiErrorBoundary>

    )    expect(screen.getByText('Something went wrong')).toBeInTheDocument()    }



    expect(screen.getByText('Something went wrong')).toBeInTheDocument()



    const resetButton = screen.getByRole('button', { name: /try again/i })    // Click retry    const { rerender } = render(

    await user.click(resetButton)

    const retryButton = screen.getByRole('button', { name: /try again/i })      <ApiErrorBoundary>

    await waitFor(() => {

      expect(screen.getByTestId('reset-success')).toBeInTheDocument()    await user.click(retryButton)        <TestComponent hasError={true} />

    }, { timeout: 1000 })

  }, 10000)      </ApiErrorBoundary>



  it('should reload page when reload button is clicked', async () => {    // Should show success after retry    )

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

        await waitFor(() => {

    const reloadMock = vi.fn()

    Object.defineProperty(window, 'location', {      expect(screen.getByTestId('retry-success')).toBeInTheDocument()    // Verify error state

      value: { reload: reloadMock },

      writable: true    }, { timeout: 1000 })    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    })

  }, 10000)    

    render(

      <ApiErrorBoundary>    const retryButton = screen.getByRole('button', { name: /try again/i })

        <ThrowError shouldThrow={true} />

      </ApiErrorBoundary>  it('should handle multiple retries with exponential backoff', async () => {    expect(retryButton).toBeInTheDocument()

    )

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const reloadButton = screen.getByRole('button', { name: /reload page/i })

    await user.click(reloadButton)    // Change the component to not throw error



    expect(reloadMock).toHaveBeenCalled()    let failCount = 0    rerender(

  }, 10000)

})    function FailingComponent() {      <ApiErrorBoundary>

      failCount++        <TestComponent hasError={false} />

      if (failCount < 3) {      </ApiErrorBoundary>

        throw new Error(`Attempt ${failCount} failed`)    )

      }

      return <div data-testid="final-success">Finally succeeded</div>    // Click retry

    }    await user.click(retryButton)



    render(    // Should show success after retry

      <ApiErrorBoundary>    await waitFor(() => {

        <FailingComponent />      expect(screen.getByTestId('retry-success')).toBeInTheDocument()

      </ApiErrorBoundary>    })

    )    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

  })

    // Should show error and retry button

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()  it('should handle multiple retries with exponential backoff', async () => {

        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    // First retry    vi.useFakeTimers()

    const retryButton = screen.getByRole('button', { name: /try again/i })

    await user.click(retryButton)    let failCount = 0

        function FailingComponent() {

    await waitFor(() => {      failCount++

      expect(screen.getByTestId('final-success')).toBeInTheDocument()      if (failCount < 3) {

    }, { timeout: 1000 })        throw new Error(`Attempt ${failCount} failed`)

  }, 10000)      }

      return <div data-testid="final-success">Finally succeeded</div>

  it('should disable retry after max attempts', async () => {    }

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(

    function AlwaysFailComponent() {      <ApiErrorBoundary>

      throw new Error('Always fails')        <FailingComponent />

    }      </ApiErrorBoundary>

    )

    render(

      <ApiErrorBoundary maxRetries={2}>    // Should show error and retry button

        <AlwaysFailComponent />    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      </ApiErrorBoundary>    

    )    // First retry

    const retryButton = screen.getByRole('button', { name: /try again/i })

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()    await user.click(retryButton)

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()    

  }, 10000)    // Fast forward to let the component re-render

    vi.advanceTimersByTime(100)

  it('should call onError prop when error occurs', () => {    

    const onErrorMock = vi.fn()    await waitFor(() => {

          expect(screen.getByTestId('final-success')).toBeInTheDocument()

    render(    }, { timeout: 1000 })

      <ApiErrorBoundary onError={onErrorMock}>

        <ThrowError shouldThrow={true} />    vi.useRealTimers()

      </ApiErrorBoundary>  }, 10000)

    )    vi.advanceTimersByTime(2000) // 2^1 * 1000 = 2000ms

    

    expect(onErrorMock).toHaveBeenCalledWith(    attemptCount = 3

      expect.any(Error),    rerender(

      expect.objectContaining({ componentStack: expect.any(String) })      <ApiErrorBoundary>

    )        <FailingComponent attemptCount={attemptCount} />

  })      </ApiErrorBoundary>

    )

  it('should handle reset functionality', async () => {

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })    // Third retry (should show "1 left")

        await waitFor(() => {

    let shouldThrow = true      expect(screen.getByRole('button', { name: /try again \(1 left\)/i })).toBeInTheDocument()

    function ResetComponent() {    })

      if (shouldThrow) {

        shouldThrow = false    await user.click(screen.getByRole('button', { name: /try again \(1 left\)/i }))

        throw new Error('Reset error')    vi.advanceTimersByTime(4000) // 2^2 * 1000 = 4000ms

      }

      return <div data-testid="reset-success">Reset successful</div>    // Should succeed on the final attempt

    }    await waitFor(() => {

      expect(screen.getByTestId('final-success')).toBeInTheDocument()

    render(    })

      <ApiErrorBoundary>

        <ResetComponent />    vi.useRealTimers()

      </ApiErrorBoundary>  })

    )

  it('should disable retry after max attempts', async () => {

    // Should show error    const user = userEvent.setup()

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()    vi.useFakeTimers()



    // Click reset/try again    function AlwaysFailingComponent() {

    const resetButton = screen.getByRole('button', { name: /try again/i })      throw new Error('Always fails')

    await user.click(resetButton)    }



    await waitFor(() => {    render(

      expect(screen.getByTestId('reset-success')).toBeInTheDocument()      <ApiErrorBoundary>

    }, { timeout: 1000 })        <AlwaysFailingComponent />

  }, 10000)      </ApiErrorBoundary>

    )

  it('should reload page when reload button is clicked', async () => {

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })    // Exhaust all retries

        for (let i = 0; i < 3; i++) {

    // Mock window.location.reload      const retryButton = screen.getByRole('button', { name: /try again/i })

    const reloadMock = vi.fn()      await user.click(retryButton)

    Object.defineProperty(window, 'location', {      vi.advanceTimersByTime(Math.pow(2, i) * 1000)

      value: { reload: reloadMock },      

      writable: true      await waitFor(() => {

    })        expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      })

    render(    }

      <ApiErrorBoundary>

        <ThrowError shouldThrow={true} />    // After 3 attempts, retry should be disabled

      </ApiErrorBoundary>    expect(screen.getByText(/Maximum retries reached/)).toBeInTheDocument()

    )    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()



    const reloadButton = screen.getByRole('button', { name: /reload page/i })    vi.useRealTimers()

    await user.click(reloadButton)  })



    expect(reloadMock).toHaveBeenCalled()  it('should call onError prop when error occurs', () => {

  }, 10000)    const onErrorMock = vi.fn()

})
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