import { Component } from 'react'

export default class ApiErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0,
      showDetails: false,
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ApiErrorBoundary caught an error:', error, errorInfo)
    this.setState({ hasError: true, error, errorInfo })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = async () => {
    const maxRetries = this.props.maxRetries ?? 3
    if (this.state.retryCount >= maxRetries) {
      return
    }

    this.setState({ isRetrying: true })

    const delay = Math.pow(2, this.state.retryCount) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))

    this.setState({
      isRetrying: false,
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      showDetails: false,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0,
      showDetails: false,
    })
  }

  render() {
    if (this.state.hasError && !this.state.isRetrying) {
      const { error, retryCount, showDetails } = this.state
      const maxRetries = this.props.maxRetries ?? 3
      const canRetry = retryCount < maxRetries

      return (
        <div className="api-error-boundary">
          <div className="error-icon">🚨</div>
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
                  {error.toString()}
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

    return this.props.children
  }
}
