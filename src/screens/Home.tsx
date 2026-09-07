import { Link } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { STAGE_ORDER } from "../game/data/stages";

const steps: { to: string; label: string; blurb: string }[] = [
  { to: "/stages", label: "Battle", blurb: "Clear stages for rewards" },
  { to: "/gacha", label: "Gacha", blurb: "Spend gems on new units" },
  { to: "/roster", label: "Level Up", blurb: "Grow your team" },
  { to: "/endless", label: "Endless", blurb: "See how far you get" },
];

export function Home() {
  const { roster, endless, clearedStageIds } = useGameData();
  const cleared = STAGE_ORDER.filter((id) => clearedStageIds.has(id)).length;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Welcome back, Commander</h1>
      <p style={{ color: "var(--muted)" }}>
        {roster?.length ?? 0} units · {cleared}/{STAGE_ORDER.length} stages cleared · best endless wave{" "}
        {endless?.best_wave ?? 0}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
        {steps.map((s) => (
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
