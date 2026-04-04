import React from 'react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-romantic-dark-bg px-4">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-romantic-dark-card shadow-lg border p-6 text-center space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Something went wrong</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The app hit an unexpected state. Reloading usually restores the session and current page cleanly.
            </p>
            <Button onClick={this.handleReload} className="romantic-btn w-full">
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
