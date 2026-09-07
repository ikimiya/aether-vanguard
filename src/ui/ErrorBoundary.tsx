import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors from a screen so a bad row of data (e.g. an owned
 * character_key no longer in src/game/data/) degrades to a message instead of a
 * blank page. In AppLayout it's keyed by pathname, so navigating away clears it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Screen crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ background: "var(--panel)", borderRadius: 12, padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>Something went wrong on this screen</h2>
        <p style={{ color: "var(--muted)" }}>
          Pick another tab from the menu above, or reload the app.
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", fontFamily: "monospace" }}>
          {this.state.error.message}
        </p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
