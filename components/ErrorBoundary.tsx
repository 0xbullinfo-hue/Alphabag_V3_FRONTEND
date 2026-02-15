import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  // Use property initializer for state to resolve "Property 'state' does not exist" errors
  public state: State = {
    hasError: false
  };

  // Explicitly declaring props to ensure it's recognized by the compiler in strict environments
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Standard error logging
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    // Accessing this.state and this.props which are now explicitly declared
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-alphabag-black flex items-center justify-center p-6 text-center">
          <div className="bg-alphabag-dark border border-alphabag-red/30 p-10 rounded-3xl shadow-2xl max-w-md">
            <div className="w-16 h-16 bg-alphabag-red/10 rounded-full flex items-center justify-center mx-auto mb-6 text-alphabag-red">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">System Node Failure</h1>
            <p className="text-alphabag-subtext text-sm mb-8">
              An unexpected exception occurred in the application layer. The intelligence stream has been interrupted.
            </p>
            <Button 
                onClick={() => window.location.reload()} 
                className="w-full font-bold uppercase tracking-widest bg-alphabag-red hover:bg-alphabag-red/80 text-white"
            >
              <RefreshCw size={16} className="mr-2" /> Reboot Interface
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}