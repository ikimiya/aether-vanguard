import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { GameDataProvider, useGameData } from "./game-data/GameDataProvider";
import { BattleLockProvider, useBattleLock } from "./battle/BattleLock";
import { ErrorBoundary } from "./ui/ErrorBoundary";

const navItems = [
  { to: "/stages", label: "Stages" },
  { to: "/gacha", label: "Gacha" },
  { to: "/roster", label: "Roster" },
  { to: "/formation", label: "Team" },
  { to: "/endless", label: "Endless" },
];

function CurrencyBar() {
  const { currencies } = useGameData();
  if (!currencies) return null;
  return (
    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
      <span title="Gems">💎 {currencies.gems}</span>
      <span title="Gold">🪙 {currencies.gold}</span>
      <span title="XP items">📘 {currencies.xp_items}</span>
    </div>
  );
}

function Header() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const locked = useBattleLock();
  const username = (session?.user.user_metadata?.username as string | undefined) ?? "Commander";

  return (
    <header style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        {locked ? (
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>Aether Vanguard</span>
        ) : (
          <Link to="/" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)", textDecoration: "none" }}>
            Aether Vanguard
          </Link>
        )}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <CurrencyBar />
          {locked ? (
            <span style={{ color: "var(--accent-2)", fontSize: "0.85rem", fontWeight: 600 }}>⚔ In battle</span>
          ) : (
            <>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{username}</span>
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/login", { replace: true });
                }}
                style={{ background: "var(--panel-2)", padding: "0.4rem 0.7rem" }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
      {!locked && (
        <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                padding: "0.35rem 0.8rem",
                borderRadius: 999,
                textDecoration: "none",
                color: isActive ? "var(--text)" : "var(--muted)",
                background: isActive ? "var(--accent)" : "var(--panel-2)",
              })}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function LayoutInner() {
  const { loading, error } = useGameData();
  const { pathname } = useLocation();
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1rem" }}>
      <Header />
      {error && <p style={{ color: "#ff8080" }}>{error}</p>}
      <main>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export function AppLayout() {
  return (
    <GameDataProvider>
      <BattleLockProvider>
        <LayoutInner />
      </BattleLockProvider>
    </GameDataProvider>
  );
}
