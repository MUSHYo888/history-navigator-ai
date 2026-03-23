// ABOUTME: Error boundary component to catch and handle React crashes gracefully
// ABOUTME: Provides user-friendly error recovery interface instead of white screen

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 min-h-screen flex items-center justify-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <span>Something went wrong</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The application encountered an unexpected error. Your data has been preserved and you can try to continue.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Error: {this.state.error?.message || 'Unknown error occurred'}
                </p>

                <div className="flex space-x-3">
                  <Button onClick={this.handleRetry} className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Go to Dashboard</span>
                  </Button>
                </div>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-4 p-3 bg-muted rounded-md text-xs">
                  <summary className="cursor-pointer font-medium">Technical Details (Development)</summary>
                  <pre className="mt-2 overflow-auto">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}