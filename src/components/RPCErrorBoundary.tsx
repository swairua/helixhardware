import React, { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
}

interface State {
  hasRPCError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component for RPC Function Failures
 * 
 * Wraps components that depend on Supabase RPC functions
 * Provides graceful degradation when RPC is not available
 * 
 * Usage:
 * <RPCErrorBoundary feature="Payment Allocations">
 *   <PaymentAllocationComponent />
 * </RPCErrorBoundary>
 */
export class RPCErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasRPCError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is an RPC-related error
    const isRPCError =
      error.message.includes('function') ||
      error.message.includes('RPC') ||
      error.message.includes('not available') ||
      error.message.includes('external API');

    return {
      hasRPCError: isRPCError,
      error: isRPCError ? error : null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.state.hasRPCError) {
      console.warn(
        `⚠️ RPC Feature "${this.props.feature || 'Unknown'}" unavailable:`,
        error.message
      );
      console.warn('Error Info:', errorInfo);
    }
  }

  render() {
    if (this.state.hasRPCError) {
      return (
        this.props.fallback || (
          <Alert className="border-amber-200 bg-amber-50 my-4">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Feature Not Available</strong>
              <br />
              {this.props.feature || 'This feature'} requires database functions that are not
              available with the external API. Use the web interface or contact your administrator.
            </AlertDescription>
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version for functional components
 */
export function useRPCError() {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleRPCError = (err: Error) => {
    if (
      err.message.includes('function') ||
      err.message.includes('RPC') ||
      err.message.includes('not available')
    ) {
      setHasError(true);
      setError(err);
      return true;
    }
    return false;
  };

  const reset = () => {
    setHasError(false);
    setError(null);
  };

  return { hasError, error, handleRPCError, reset };
}
