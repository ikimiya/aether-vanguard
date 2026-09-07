import { supabaseConfigured } from "../lib/supabase";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ width: "min(100% - 2rem, 380px)", margin: "clamp(2rem, 10vh, 5rem) auto 3rem" }}>
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
  );
}
