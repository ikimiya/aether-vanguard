import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthShell } from "./AuthShell";

export function Signup() {
  const { session, signUp } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signUp(email, password, username.trim());
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create account">
      <form onSubmit={onSubmit}>
        <label>
          Display name
          <input
            required
            minLength={2}
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        <button className="btn--block" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "var(--s-4)" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
