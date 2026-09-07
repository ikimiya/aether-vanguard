import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";

export function AppLayout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const username = (session?.user.user_metadata?.username as string | undefined) ?? "Commander";

  async function onSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1rem" }}>
      <header
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
          <Link
            to="/"
            style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)", textDecoration: "none" }}
          >
            Aether Vanguard
          </Link>
          <nav style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/battle">Battle Sandbox</Link>
          </nav>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{username}</span>
          <button onClick={onSignOut} style={{ background: "var(--panel-2)" }}>
            Sign out
          </button>
        </div>
      </header>
      <main style={{ marginTop: "1.5rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
