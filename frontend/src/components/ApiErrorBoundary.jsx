import { Component } from 'react'

export default class ApiErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ApiErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // Log error to external service in production
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = async () => {
    if (this.state.retryCount >= 3) {
      return // Max retries reached
    }

    this.setState({ isRetrying: true })
    
    // Exponential backoff delay
    const delay = Math.pow(2, this.state.retryCount) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))
    
    this.setState({ 
      isRetrying: false,
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    })
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0
    })
  }

  render() {
    if (this.state.hasError && !this.state.isRetrying) {
      const { error, retryCount } = this.state
      const canRetry = retryCount < 3
      
      return (
        <div className="api-error-boundary">
          <div className="error-icon">🚨</div>
          <h3>Something went wrong</h3>
          <p>We encountered an error while loading data. {canRetry ? 'Please try again.' : 'Maximum retries reached.'}</p>
          
          <div className="error-actions">
            {canRetry && (
              <button onClick={this.handleRetry} className="retry-btn" disabled={this.state.isRetrying}>
                {this.state.isRetrying ? 'Retrying...' : `Try Again${retryCount > 0 ? ` (${3 - retryCount} left)` : ''}`}
              </button>
            )}
            
            <button onClick={this.handleReset} className="reset-btn">
              Reset
            </button>
            
            <button onClick={() => window.location.reload()} className="reload-btn">
              Reload Page
            </button>
          </div>

          {this.state.error && (
            <details className="error-details">
              <summary>Error details</summary>
              <pre>{this.state.error.toString()}</pre>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <pre>{this.state.errorInfo.componentStack}</pre>
              )}
            </details>
          )}
          
          <p className="error-help">
            If this problem persists, try refreshing the page or{' '}
            <a href="/">return to the homepage</a>.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}