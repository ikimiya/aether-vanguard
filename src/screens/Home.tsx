import { Link } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { STAGE_ORDER } from "../game/data/stages";

const links: { to: string; label: string; blurb: string }[] = [
  { to: "/gacha", label: "Summon", blurb: "Spend gems on new units" },
  { to: "/roster", label: "Roster", blurb: "Level and ascend your units" },
  { to: "/formation", label: "Team", blurb: "Set your battle formation" },
  { to: "/endless", label: "Endless", blurb: "See how far you get" },
];

export function Home() {
  const { roster, endless, clearedStageIds } = useGameData();
  const total = STAGE_ORDER.length;
  const cleared = STAGE_ORDER.filter((id) => clearedStageIds.has(id)).length;
  const cta =
    cleared === 0 ? "Start campaign →" : cleared >= total ? "Replay stages →" : "Continue campaign →";

  return (
    <div>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid #2a3048",
          background: "linear-gradient(135deg, #1b1f34, #12141f 62%)",
          padding: "2rem 1.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.3,
            background: "radial-gradient(560px circle at 82% -25%, var(--accent), transparent 60%)",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ color: "var(--accent-2)", letterSpacing: 3, fontSize: "0.72rem", textTransform: "uppercase" }}>
            Aether Vanguard
          </div>
          <h1 style={{ margin: "0.35rem 0 0.75rem", fontSize: "2rem" }}>Welcome back, Commander</h1>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", color: "var(--muted)", fontSize: "0.9rem" }}>
            <span>
              <strong style={{ color: "var(--text)" }}>{roster?.length ?? 0}</strong> units
            </span>
            <span>
              <strong style={{ color: "var(--text)" }}>
                {cleared}/{total}
              </strong>{" "}
              stages cleared
            </span>
            <span>
              best endless wave <strong style={{ color: "var(--text)" }}>{endless?.best_wave ?? 0}</strong>
            </span>
          </div>
          <Link
            to="/stages"
            style={{
              display: "inline-block",
              marginTop: "1.4rem",
              background: "var(--accent)",
              color: "var(--text)",
              textDecoration: "none",
              padding: "0.7rem 1.6rem",
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            {cta}
          </Link>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {links.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            style={{ textDecoration: "none", color: "var(--text)", background: "var(--panel)", borderRadius: 12, padding: "1rem" }}
          >
            <div style={{ fontWeight: 700 }}>{s.label}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{s.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
