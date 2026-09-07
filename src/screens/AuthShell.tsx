import { supabaseConfigured } from "../lib/supabase";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        height: "100dvh",
        overflowY: "auto",
        display: "grid",
        placeItems: "center",
        padding: "var(--s-6) var(--s-4)",
      }}
    >
      <div style={{ width: "min(100%, 380px)" }}>
        <h1 className="brand center" style={{ display: "block", fontSize: "var(--fs-xl)" }}>
          Aether Vanguard
        </h1>
        <div className="panel--raised">
          <h2 style={{ marginTop: 0 }}>{title}</h2>
          {!supabaseConfigured && (
            <p style={{ color: "var(--warn)", fontSize: "var(--fs-sm)" }}>
              Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in
              <code> .env</code>.
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
