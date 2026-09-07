import { Link, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1rem" }}>
      <header style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)", textDecoration: "none" }}>
          Aether Vanguard
        </Link>
        <nav style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/battle">Battle Sandbox</Link>
        </nav>
      </header>
      <main style={{ marginTop: "1.5rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
