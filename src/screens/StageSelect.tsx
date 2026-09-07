import { Link } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { CHAPTER_1 } from "../game/data/stages/chapter-1";
import { isStageUnlocked } from "../game/data/stages";

function Stars({ n }: { n: number }) {
  return <span style={{ color: "#ffd166" }}>{"★".repeat(n)}<span style={{ color: "var(--panel-2)" }}>{"★".repeat(3 - n)}</span></span>;
}

export function StageSelect() {
  const { progress, clearedStageIds } = useGameData();
  const starsById = new Map((progress ?? []).map((p) => [p.stage_id, p.stars]));

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Chapter 1 — The Cinder Road</h2>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {CHAPTER_1.map((stage) => {
          const unlocked = isStageUnlocked(stage.id, clearedStageIds);
          const body = (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--panel)",
                borderRadius: 10,
                padding: "0.75rem 1rem",
                opacity: unlocked ? 1 : 0.45,
              }}
            >
              <div>
                <strong>{stage.id}</strong> · {stage.name}
                <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                  {stage.waves.length} wave{stage.waves.length === 1 ? "" : "s"}
                  {stage.waves.flat().some((w) => w.enemyId === "cinder-wyrm") ? " · BOSS" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <Stars n={starsById.get(stage.id) ?? 0} />
                {unlocked ? <span style={{ color: "var(--accent-2)" }}>Fight →</span> : <span>🔒</span>}
              </div>
            </div>
          );
          return unlocked ? (
            <Link key={stage.id} to={`/stages/${stage.id}`} style={{ textDecoration: "none", color: "var(--text)" }}>
              {body}
            </Link>
          ) : (
            <div key={stage.id}>{body}</div>
          );
        })}
      </div>
    </div>
  );
}
