import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-bg-surface border border-error/30 rounded-lg p-6 m-4">
          <h3 className="text-error font-medium mb-2">Something went wrong</h3>
          <p className="text-text-muted text-sm mb-3">
            {this.state.error?.message || 'An unexpected error occurred while rendering.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="border border-border-line text-text-primary px-4 py-2 rounded text-sm hover:border-accent-cyan/50 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
