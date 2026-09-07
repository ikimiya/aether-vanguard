import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { GameDataProvider, useGameData } from "./game-data/GameDataProvider";
import { BattleLockProvider, useBattleLock } from "./battle/BattleLock";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { IconEndless, IconGacha, IconRoster, IconStages, IconTeam } from "./ui/icons";

const navItems = [
  { to: "/stages", label: "Stages", Icon: IconStages },
  { to: "/gacha", label: "Gacha", Icon: IconGacha },
  { to: "/roster", label: "Roster", Icon: IconRoster },
  { to: "/formation", label: "Team", Icon: IconTeam },
  { to: "/endless", label: "Endless", Icon: IconEndless },
];

function CurrencyBar() {
  const { currencies } = useGameData();
  if (!currencies) return null;
  return (
    <div className="cluster">
      <span className="chip" title="Gems">💎 {currencies.gems}</span>
      <span className="chip" title="Gold">🪙 {currencies.gold}</span>
      <span className="chip" title="XP items">📘 {currencies.xp_items}</span>
    </div>
  );
}

function AppBar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const locked = useBattleLock();
  const username = (session?.user.user_metadata?.username as string | undefined) ?? "Commander";

  return (
    <header className="appbar">
      {locked ? (
        <span className="brand">Aether Vanguard</span>
      ) : (
        <Link to="/" className="brand">Aether Vanguard</Link>
      )}
      <div className="appbar__right">
        <CurrencyBar />
        {locked ? (
          <span className="chip chip--accent">⚔ In battle</span>
        ) : (
          <button
            className="btn--ghost btn--sm"
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
            title={username}
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}

function LayoutInner() {
  const { loading, error } = useGameData();
  const locked = useBattleLock();
  const { pathname } = useLocation();

  return (
    <div className="app">
      <AppBar />
      {!locked && (
        <nav className="nav">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => "nav-link" + (isActive ? " is-active" : "")}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}

      <main className="page">
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        {loading ? (
          <div className="stack">
            <div className="skeleton" style={{ height: 160 }} />
            <div className="skeleton" style={{ height: 90 }} />
            <div className="skeleton" style={{ height: 90 }} />
          </div>
        ) : (
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        )}
      </main>

      {!locked && (
        <nav className="bottom-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => "bottom-nav__item" + (isActive ? " is-active" : "")}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
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
