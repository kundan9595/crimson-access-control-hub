import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

// Error reporting service (replace with your actual error reporting service)
const reportError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
  // In production, send to your error reporting service
  console.error('Error reported:', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    errorId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
};

// Generate unique error ID
const generateErrorId = () => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Error Fallback Component
const ErrorFallback: React.FC<{
  error: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  onReset: () => void;
}> = ({ error, errorInfo, errorId, onReset }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCopyError = () => {
    const errorDetails = `
Error ID: ${errorId}
Message: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack || 'No component stack available'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorDetails);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600">
            We're sorry, but something unexpected happened. Our team has been notified.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Error ID</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyError}
                className="text-xs"
              >
                Copy Details
              </Button>
            </div>
            <code className="text-xs text-gray-600 break-all">{errorId}</code>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-lg bg-gray-50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Error Details (Development Only)
              </summary>
              <div className="space-y-2">
                <div>
                  <strong className="text-sm text-gray-700">Message:</strong>
                  <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">{error.message}</pre>
                </div>
                <div>
                  <strong className="text-sm text-gray-700">Stack:</strong>
                  <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{error.stack}</pre>
                </div>
                <div>
                  <strong className="text-sm text-gray-700">Component Stack:</strong>
                  <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{errorInfo?.componentStack || 'No component stack available'}</pre>
                </div>
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              onClick={onReset}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={handleGoBack}
              className="flex-1"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Global Error Boundary Component
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: generateErrorId()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId();
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Report error to monitoring service
    reportError(error, errorInfo, errorId);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when props change (if enabled)
    if (this.props.resetOnPropsChange && prevProps !== this.props) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use default error fallback
      return (
        <ErrorFallback
          error={this.state.error || new Error('Unknown error occurred')}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId || 'unknown-error'}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundary
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    // Report error
    reportError(error, { componentStack: '' }, generateErrorId());
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, resetError };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) => {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
