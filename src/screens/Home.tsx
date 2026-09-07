import { Link } from "react-router-dom";

const LOOP = ["Battle", "Rewards", "Gacha", "Level Up", "Gacha"];

export function Home() {
  return (
    <div>
      <h1>Aether Vanguard</h1>
      <p style={{ color: "var(--muted)" }}>
        A turn-based anime gacha game. Clear stages or push endless mode.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          margin: "1.5rem 0",
        }}
      >
        {LOOP.map((step, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                background: "var(--panel-2)",
                borderRadius: 999,
                padding: "0.35rem 0.8rem",
              }}
            >
              {step}
            </span>
            {i < LOOP.length - 1 && <span style={{ color: "var(--muted)" }}>→</span>}
          </span>
        ))}
      </div>

      <Link to="/battle">
        <button>Open Battle Sandbox</button>
      </Link>
    </div>
  );
}
