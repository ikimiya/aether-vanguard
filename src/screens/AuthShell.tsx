import { supabaseConfigured } from "../lib/supabase";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 360, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>Aether Vanguard</h1>
      <div style={{ background: "var(--panel)", borderRadius: 12, padding: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {!supabaseConfigured && (
          <p style={{ color: "#ffcf6b", fontSize: "0.85rem" }}>
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in
            <code> .env</code>.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
