import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, Terminal } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg text-slate-150 flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none relative overflow-hidden">
          {/* Floating subtle ambient bubbles backgrounds */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/10 w-48 h-48 rounded-full bg-rose-500/5 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/10 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-md w-full bg-brand-box/95 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 backdrop-blur-md space-y-6 text-center">
            
            {/* Visual Header Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
              <AlertOctagon className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white tracking-tight">System Glitch Detected</h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                FishInvest encountered a rendering glitch, possibly due to a connection drop or resource loading failure.
              </p>
            </div>

            {/* Error Message Details */}
            {this.state.error && (
              <div className="bg-brand-bg/80 border border-cyan-950/40 rounded-xl p-3 text-left font-mono text-[10px] text-rose-300 max-h-24 overflow-y-auto space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[8px]">Diagnostics:</span>
                <p className="break-all font-semibold leading-tight">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <p className="text-[9px] text-slate-500 leading-normal truncate">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
            )}

            {/* CTA Operations */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full h-11 bg-cyan-500 text-slate-950 hover:bg-cyan-400 border border-cyan-400/20 font-sans font-extrabold text-xs tracking-wide rounded-xl active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Recovery</span>
              </button>
              
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full h-11 bg-brand-bg hover:bg-cyan-950/30 text-slate-200 border border-cyan-500/25 font-sans font-extrabold text-xs tracking-wide rounded-xl active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Reload Page</span>
              </button>
            </div>

            {/* Secondary fallback block */}
            <div className="pt-2 border-t border-cyan-900/10 flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-semibold block font-sans">Persistent crash?</span>
              <button
                type="button"
                onClick={this.handleClearCache}
                className="hover:underline font-bold text-rose-400/80 active:scale-95 transition-all"
              >
                Clear Cache & Reset Setup
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
