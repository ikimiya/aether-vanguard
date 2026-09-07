import { useState } from "react";
import { BattleView, type BattleResult } from "../battle/BattleView";
import type { BattleConfig } from "../game/engine";
import { getStage } from "../game/data/stages";

// A fixed team so the battle scene can be exercised without gacha/roster.
const DEV_TEAM = [
  { characterId: "nyx", level: 20, star: 1 },
  { characterId: "seraphine", level: 20, star: 1 },
  { characterId: "ayaka", level: 18, star: 1 },
  { characterId: "sora", level: 18, star: 1 },
  { characterId: "hana", level: 16, star: 1 },
];

const STAGE_IDS = ["1-1", "1-2", "1-4", "1-8"];

export function BattleSandbox() {
  const [stageId, setStageId] = useState<string | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);

  if (stageId) {
    const stage = getStage(stageId);
    const config: BattleConfig = { seed: Date.now() % 100000, party: DEV_TEAM, waves: stage.waves };
    return (
      <div className="page">
        <BattleView
          config={config}
          title={`${stage.id} · ${stage.name}`}
          onFinish={(r) => {
            setResult(r);
            setStageId(null);
          }}
          onExit={() => setStageId(null)}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Battle Sandbox</h1>
      {result && (
        <p style={{ color: result.won ? "var(--good)" : "var(--danger)" }}>
          Last run: {result.won ? "Victory" : "Defeat"} in {result.rounds} rounds
          {result.won && result.noDeaths ? " (flawless)" : ""}.
        </p>
      )}
      <p className="muted">Fixed dev team. Pick a stage:</p>
      <div className="cluster">
        {STAGE_IDS.map((id) => (
          <button className="btn--ghost" key={id} onClick={() => setStageId(id)}>
            {getStage(id).id} · {getStage(id).name}
          </button>
        ))}
      </div>
    </div>
  );
}
