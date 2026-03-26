import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-200">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-2xl font-black text-[#002147] uppercase tracking-tight mb-4">Something went wrong</h1>
            
            <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
              The application encountered an unexpected error. This has been logged for our technical team to review.
            </p>

            {this.state.error && (
              <div className="mb-10 p-4 bg-slate-50 rounded-xl border border-slate-100 text-left overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Error Detail</p>
                <p className="text-xs font-mono text-red-500 break-all">{this.state.error.message}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-[#002147] text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg active:scale-95"
              >
                <RefreshCw size={16} />
                Reload Application
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                <Home size={16} />
                Return to Home
              </button>
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">National Mission Digital Portal</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
