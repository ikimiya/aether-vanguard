import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { BattleView, type BattleResult } from "../battle/BattleView";
import type { BattleConfig } from "../game/engine";
import { getStage } from "../game/data/stages";
import { resolveTeam, toParty } from "../game/party";
import { claimStageRewards, type StageRewardResult } from "../lib/operations";

export function StageBattle() {
  const { stageId = "" } = useParams();
  const navigate = useNavigate();
  const { roster, formation, reload } = useGameData();
  const [summary, setSummary] = useState<StageRewardResult | null>(null);
  const [busy, setBusy] = useState(false);

  const stage = useMemo(() => {
    try {
      return getStage(stageId);
    } catch {
      return null;
    }
  }, [stageId]);

  const party = useMemo(
    () => (roster ? toParty(roster, resolveTeam(roster, formation ?? [])) : []),
    [roster, formation],
  );

  const config = useMemo<BattleConfig>(
    () => ({ seed: Math.floor(Math.random() * 1_000_000), party, waves: stage?.waves ?? [] }),
    [stage, party],
  );

  if (!stage) return <p>Unknown stage. <button onClick={() => navigate("/stages")}>Back</button></p>;
  if (party.length === 0) {
    return (
      <p>
        You have no deployable units. Try the <button onClick={() => navigate("/gacha")}>Gacha</button>.
      </p>
    );
  }

  if (summary) {
    return (
      <div style={{ background: "var(--panel)", borderRadius: 12, padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>{stage.id} — {summary.stars > 0 ? "Cleared" : "Retreat"}</h2>
        {summary.stars > 0 && <p style={{ color: "#ffd166" }}>{"★".repeat(summary.stars)}</p>}
        {Object.keys(summary.rewards).length > 0 ? (
          <ul style={{ color: "var(--muted)" }}>
            {summary.rewards.gems ? <li>💎 {summary.rewards.gems} gems</li> : null}
            {summary.rewards.gold ? <li>🪙 {summary.rewards.gold} gold</li> : null}
            {summary.rewards.xp_items ? <li>📘 {summary.rewards.xp_items} xp items</li> : null}
          </ul>
        ) : (
          <p style={{ color: "var(--muted)" }}>No rewards this time.</p>
        )}
        {summary.firstClear && <p style={{ color: "var(--accent-2)" }}>First clear!</p>}
        <button onClick={() => navigate("/stages")}>Back to stages</button>
      </div>
    );
  }

  async function finish(result: BattleResult) {
    setBusy(true);
    try {
      const res = await claimStageRewards(stage!.id, {
        cleared: result.won,
        rounds: result.rounds,
        noDeaths: result.noDeaths,
      });
      await reload();
      setSummary(res);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {busy && <p style={{ color: "var(--muted)" }}>Saving…</p>}
      <BattleView
        config={config}
        title={`${stage.id} · ${stage.name}`}
        onFinish={finish}
        onExit={() => navigate("/stages")}
      />
    </>
  );
}
