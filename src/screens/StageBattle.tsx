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

  if (!stage)
    return (
      <p className="row">
        Unknown stage. <button className="btn--sm" onClick={() => navigate("/stages")}>Back</button>
      </p>
    );
  if (party.length === 0) {
    return (
      <p className="row">
        No deployable units.{" "}
        <button className="btn--sm" onClick={() => navigate("/gacha")}>Gacha</button>
      </p>
    );
  }

  if (summary) {
    return (
      <div className="result-panel stack">
        <h2 style={{ margin: 0 }}>
          {stage.id} — {summary.stars > 0 ? "Cleared" : "Retreat"}
        </h2>
        {summary.stars > 0 && (
          <p style={{ margin: 0, color: "var(--gold)", fontSize: "var(--fs-lg)" }}>
            {"★".repeat(summary.stars)}
          </p>
        )}
        {Object.keys(summary.rewards).length > 0 ? (
          <div className="cluster">
            {summary.rewards.gems ? <span className="chip">💎 {summary.rewards.gems}</span> : null}
            {summary.rewards.gold ? <span className="chip">🪙 {summary.rewards.gold}</span> : null}
            {summary.rewards.xp_items ? <span className="chip">📘 {summary.rewards.xp_items}</span> : null}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>No rewards this time.</p>
        )}
        {summary.firstClear && <span className="chip chip--accent">First clear!</span>}
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
      {busy && <p className="muted">Saving…</p>}
      <BattleView
        config={config}
        title={`${stage.id} · ${stage.name}`}
        onFinish={finish}
        onExit={() => navigate("/stages")}
      />
    </>
  );
}
