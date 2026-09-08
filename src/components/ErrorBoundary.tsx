import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("rs-current-resume");
      localStorage.removeItem("rs-current-template");
      localStorage.removeItem("rs-builder-starter");
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-3xl shadow-xl">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                We encountered an unexpected error while loading this page.
              </p>
              {this.state.error?.message && (
                <div className="p-3 mt-2 rounded-xl bg-muted/60 text-xs text-muted-foreground font-mono text-left break-words max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="default"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground font-semibold"
              >
                <RefreshCw className="h-4 w-4" /> Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = "/"; }}
                className="w-full sm:w-auto gap-2"
              >
                <Home className="h-4 w-4" /> Go Home
              </Button>
            </div>
            <button
              onClick={this.handleReset}
              className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted pt-2 block mx-auto"
            >
              Reset stored resume data & reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
