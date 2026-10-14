import { Component, type ErrorInfo, type ReactNode } from "react";
import { ServerErrorPage } from "@/features/misc/ServerErrorPage";

/** Outermost crash barrier; shows the error detail only in development. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ServerErrorPage detail={import.meta.env.DEV ? this.state.error.message : undefined} />
      );
    }
    return this.props.children;
  }
}
