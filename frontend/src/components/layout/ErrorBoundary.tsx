import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Friendly fallback in production; stack trace only in development. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 font-mono" role="alert">
        <p className="text-danger-300">Segmentation fault (core dumped)</p>
        <h1 className="mt-4 text-2xl font-bold text-neutral-50">Something went wrong.</h1>
        <p className="mt-2 text-neutral-300">
          Please reload the page. If it keeps happening, try again later.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-bg-page hover:bg-primary-400"
        >
          Reload
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-8 overflow-x-auto rounded border border-neutral-800 bg-bg-surface p-4 text-xs text-neutral-300">
            {error.stack}
          </pre>
        )}
      </main>
    );
  }
}
