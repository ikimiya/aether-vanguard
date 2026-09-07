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
      <section className="hero">
        <div className="hero__eyebrow">Aether Vanguard</div>
        <h1 style={{ margin: "0.4rem 0 0.9rem" }}>Welcome back, Commander</h1>
        <div className="row" style={{ gap: "var(--s-6)" }}>
          <div className="stat">
            <span className="stat__value">{roster?.length ?? 0}</span>
            <span className="stat__label">units</span>
          </div>
          <div className="stat">
            <span className="stat__value">{cleared}/{total}</span>
            <span className="stat__label">stages cleared</span>
          </div>
          <div className="stat">
            <span className="stat__value">{endless?.best_wave ?? 0}</span>
            <span className="stat__label">best endless wave</span>
          </div>
        </div>
        <Link to="/stages" className="btn" style={{ marginTop: "var(--s-6)" }}>
          {cta}
        </Link>
      </section>

      <div className="card-grid" style={{ "--card-min": "170px" } as React.CSSProperties}>
        {links.map((s) => (
          <Link key={s.to} to={s.to} className="card" style={{ textAlign: "left", padding: "var(--s-4)" }}>
            <div style={{ fontWeight: 700 }}>{s.label}</div>
            <div className="card__meta">{s.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
