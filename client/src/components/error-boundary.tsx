import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error, retry: () => void}>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Store error in localStorage for performance monitoring
    const errorMetric = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      type: 'frontend_error'
    };
    
    const existingErrors = JSON.parse(localStorage.getItem('errorMetrics') || '[]');
    existingErrors.push(errorMetric);
    
    // Keep only last 50 errors
    if (existingErrors.length > 50) {
      existingErrors.splice(0, existingErrors.length - 50);
    }
    
    localStorage.setItem('errorMetrics', JSON.stringify(existingErrors));
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  エラーが発生しました
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-sm bg-gray-100 p-3 rounded">
                  <summary className="cursor-pointer font-medium">エラー詳細</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack && '\n\n' + this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                  style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  再試行
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                >
                  ページを再読み込み
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{error: Error, retry: () => void}>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}