import { Component, type ErrorInfo, type ReactNode } from 'react';

import { GlobalErrorFallback } from '@/components/feedback/GlobalErrorFallback';
import { ROUTES } from '@/constants/routes';
import { isProductionUi } from '@/utils/toUserErrorMessage';

interface AppErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (!isProductionUi()) {
      console.error('AppErrorBoundary caught an error', error, info.componentStack);
      return;
    }

    console.error('AppErrorBoundary caught an error', error.message);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  private handleGoHome = () => {
    this.setState({ error: null });
    window.location.assign(ROUTES.dashboard);
  };

  override render() {
    if (this.state.error) {
      return (
        <GlobalErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}
