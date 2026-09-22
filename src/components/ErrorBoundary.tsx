import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-stone-900/5 border border-white/10 rounded-3xl m-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 mb-4 font-serif text-xl">
            Z
          </div>
          <h2 className="text-xl font-serif text-stone-900 dark:text-white mb-2">
            {this.props.fallbackTitle || 'Atelier Collection Notice'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mb-6 leading-relaxed">
            A temporary display error occurred while rendering this section. Our concierges have caught the incident.
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer hover:bg-amber-400 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-white/15 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
