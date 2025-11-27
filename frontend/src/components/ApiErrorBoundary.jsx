import { Component } from 'react'

// Persist the last captured error so the fallback stays visible even if React remounts
// the boundary (common during dev/strict render replays) until the user explicitly retries or resets.
let lastErrorSnapshot = null

export default class ApiErrorBoundary extends Component {
  constructor(props) {
    super(props)
    const snapshot = lastErrorSnapshot
    this.state = {
      hasError: Boolean(snapshot),
      lockFallback: Boolean(snapshot),
      error: snapshot?.error ?? null,
      errorInfo: snapshot?.errorInfo ?? null,
      isRetrying: false,
      retryCount: 0,
      showDetails: false,
    }
    this.hasErrored = Boolean(snapshot)
    this.hasNotified = Boolean(snapshot?.notified)
  }

  static getDerivedStateFromError(error) {
    lastErrorSnapshot = { error, errorInfo: null, notified: false }
    return { hasError: true, lockFallback: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ApiErrorBoundary caught an error:', error, errorInfo)
    this.hasErrored = true
    lastErrorSnapshot = { error, errorInfo, notified: false }
    this.notifyError(error, errorInfo)
    this.setState({ hasError: true, lockFallback: true, error, errorInfo })
  }

  componentDidMount() {
    if ((this.state.hasError || this.hasErrored) && lastErrorSnapshot && !this.hasNotified) {
      this.notifyError(lastErrorSnapshot.error, lastErrorSnapshot.errorInfo)
    }
  }

  componentWillUnmount() {
    // Defer clearing so React strict/dev remounts during the same tick still see the snapshot.
    setTimeout(() => {
      lastErrorSnapshot = null
    }, 0)
  }

  handleRetry = async () => {
    const maxRetries = this.props.maxRetries ?? 3
    if (this.state.retryCount >= maxRetries) return

    this.setState({ isRetrying: true })
    const delay = Math.pow(2, this.state.retryCount) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))

    this.setState({
      isRetrying: false,
      hasError: false,
      lockFallback: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      showDetails: false,
    })
    lastErrorSnapshot = null
    this.hasErrored = false
    this.hasNotified = false
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      lockFallback: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0,
      showDetails: false,
    })
    lastErrorSnapshot = null
    this.hasErrored = false
    this.hasNotified = false
  }

  notifyError(error, errorInfo) {
    if (this.hasNotified || !this.props.onError) return
    this.props.onError(error, errorInfo ?? { componentStack: '' })
    this.hasNotified = true
    if (lastErrorSnapshot) {
      lastErrorSnapshot.notified = true
    }
  }

  render() {
    const { hasError, lockFallback, isRetrying, error, retryCount, showDetails } = this.state

    if ((hasError || lockFallback || this.hasErrored) && !isRetrying) {
      const maxRetries = this.props.maxRetries ?? 3
      const canRetry = retryCount < maxRetries

      return (
        <div className="api-error-boundary">
          <div className="error-icon">!</div>
          <h3>Something went wrong</h3>
          <p>We encountered an error while loading data. {canRetry ? 'Please try again.' : 'Maximum retries reached.'}</p>

          <div className="error-actions">
            {canRetry && (
              <button onClick={this.handleRetry} className="retry-btn" disabled={this.state.isRetrying}>
                {this.state.isRetrying ? 'Retrying...' : `Try Again${retryCount > 0 ? ` (${maxRetries - retryCount} left)` : ''}`}
              </button>
            )}

            <button onClick={this.handleReset} className="reset-btn">
              Reset
            </button>

            <button onClick={() => window.location.reload()} className="reload-btn">
              Reload Page
            </button>
          </div>

          {error && (
            <div className="error-details">
              <button type="button" onClick={() => this.setState({ showDetails: !showDetails })}>
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              {showDetails && (
                <pre>
                  {(error.message || String(error))}
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo?.componentStack && (
                    '\n' + this.state.errorInfo.componentStack
                  )}
                </pre>
              )}
            </div>
          )}

          <p className="error-help">
            If this problem persists, try refreshing the page or <a href="/">return to the homepage</a>.
          </p>
        </div>
      )
    }

    // Try rendering children; if they throw synchronously, catch and show fallback immediately.
    try {
      return this.props.children
    } catch (err) {
      console.error('ApiErrorBoundary caught an error during render:', err)
      this.hasErrored = true
      lastErrorSnapshot = { error: err, errorInfo: null, notified: false }
      this.notifyError(err, null)
      if (!hasError || !lockFallback) {
        // Trigger state update to keep fallback on next render
        this.setState({ hasError: true, lockFallback: true, error: err })
      }
      return (
        <div className="api-error-boundary">
          <div className="error-icon">!</div>
          <h3>Something went wrong</h3>
          <p>We encountered an error while loading data. Please try again.</p>
        </div>
      )
    }
  }
}
