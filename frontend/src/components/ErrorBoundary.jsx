import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SignalSense ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="card-theme max-w-lg w-full p-8 rounded-3xl border border-red-500/25 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-cream-200">
                Something went wrong rendering this view
              </h2>
              <p className="text-xs sm:text-sm text-plum-800/80 dark:text-cream-300/80">
                An unexpected component error occurred. The application has contained the error to prevent a blank screen.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-left font-mono text-xs text-red-700 dark:text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2.5 rounded-xl border border-berry-600/30 text-berry-800 dark:text-coral-200 bg-white/50 dark:bg-plum-900/40 hover:bg-berry-600/10 font-heading font-semibold text-xs inline-flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl btn-primary font-heading font-semibold text-xs inline-flex items-center space-x-2 shadow-md cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Overview</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
