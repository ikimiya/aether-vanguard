import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { GameDataProvider, useGameData } from "./game-data/GameDataProvider";
import { BattleLockProvider, useBattleLock } from "./battle/BattleLock";
import { ErrorBoundary } from "./ui/ErrorBoundary";

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
  const { pathname } = useLocation();
  const username = (session?.user.user_metadata?.username as string | undefined) ?? "Commander";

  return (
    <header className="appbar">
      {locked || pathname === "/" ? (
        <span className="brand">Aether Vanguard</span>
      ) : (
        <Link to="/" className="btn--ghost btn--sm">‹ Menu</Link>
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
  const { pathname } = useLocation();
  const screenRef = useRef<HTMLElement>(null);

  // each screen starts at the top — the scroll lives in .screen, not the window
  useEffect(() => {
    screenRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <AppBar />

      <main className="screen" ref={screenRef}>
        <div className="page">
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
        </div>
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
