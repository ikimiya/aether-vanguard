import { Link } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { CHAPTER_1 } from "../game/data/stages/chapter-1";
import { isStageUnlocked } from "../game/data/stages";

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "var(--gold)", letterSpacing: 1 }}>
      {"★".repeat(n)}
      <span style={{ color: "var(--surface-3)" }}>{"★".repeat(3 - n)}</span>
    </span>
  );
}

export function StageSelect() {
  const { progress, clearedStageIds } = useGameData();
  const starsById = new Map((progress ?? []).map((p) => [p.stage_id, p.stars]));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Chapter 1</h1>
          <p>The Cinder Road</p>
        </div>
      </div>

      <div className="list">
        {CHAPTER_1.map((stage) => {
          const unlocked = isStageUnlocked(stage.id, clearedStageIds);
          const isBoss = stage.waves.flat().some((w) => w.enemyId === "cinder-wyrm");
          const inner = (
            <>
              <div>
                <div style={{ fontWeight: 600 }}>
                  <span className="muted">{stage.id}</span> &nbsp;{stage.name}
                </div>
                <div className="cluster" style={{ marginTop: "var(--s-1)" }}>
                  <span className="chip">
                    {stage.waves.length} wave{stage.waves.length === 1 ? "" : "s"}
                  </span>
                  {isBoss && <span className="chip chip--accent">BOSS</span>}
                </div>
              </div>
              <div className="row" style={{ gap: "var(--s-3)", flexWrap: "nowrap" }}>
                <Stars n={starsById.get(stage.id) ?? 0} />
                {unlocked ? (
                  <span style={{ color: "var(--accent-2)" }}>Fight →</span>
                ) : (
                  <span aria-label="locked">🔒</span>
                )}
              </div>
            </>
          );
          return unlocked ? (
            <Link key={stage.id} to={`/stages/${stage.id}`} className="list-row">
              {inner}
            </Link>
          ) : (
            <div key={stage.id} className="list-row is-locked">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
