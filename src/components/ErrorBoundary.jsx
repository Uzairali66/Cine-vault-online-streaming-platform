import { Component } from 'react';

/**
 * ErrorBoundary — catches React rendering crashes and shows a fallback UI
 * instead of letting the entire page go blank (pitch black).
 *
 * NOTE: Does NOT import from react-router-dom to avoid circular dependency issues
 * with code-split chunks. Navigation uses window.location.href instead of Link.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main>
          <div className="pattern" />
          <div className="wrapper flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-red-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="!text-2xl text-white mb-3">Something went wrong</h2>
              <p className="text-light-200 mb-2">
                The page encountered an error while loading. This is usually a temporary issue.
              </p>
              <p className="text-gray-500 text-xs mb-6 font-mono">
                {this.state.error?.message || 'Unknown error'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Reload Page
                </button>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.href = '/';
                  }}
                  className="inline-block bg-light-100/10 text-light-200 px-6 py-3 rounded-xl hover:bg-light-100/20 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;