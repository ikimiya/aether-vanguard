import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { BattleView, type BattleResult } from "../battle/BattleView";
import type { BattleConfig } from "../game/engine";
import { endlessWave } from "../game/endless";
import { resolveTeam, toParty } from "../game/party";
import { submitEndlessRun } from "../lib/operations";

type Phase = { kind: "briefing" } | { kind: "fighting" } | { kind: "done"; cleared: number };

export function Endless() {
  const navigate = useNavigate();
  const { roster, endless, formation, reload } = useGameData();
  const [seed] = useState(() => Date.now() % 1_000_000);
  const [wave, setWave] = useState(1);
  const [phase, setPhase] = useState<Phase>({ kind: "briefing" });

  const party = useMemo(
    () => (roster ? toParty(roster, resolveTeam(roster, formation ?? [])) : []),
    [roster, formation],
  );

  if (party.length === 0) {
    return (
      <p className="row">
        No deployable units.{" "}
        <button className="btn--sm" onClick={() => navigate("/gacha")}>Gacha</button>
      </p>
    );
  }

  async function onFinish(result: BattleResult) {
    if (result.won) {
      setWave((w) => w + 1);
      setPhase({ kind: "briefing" });
      return;
    }
    const cleared = wave - 1;
    await submitEndlessRun(cleared);
    await reload();
    setPhase({ kind: "done", cleared });
  }

  if (phase.kind === "done") {
    return (
      <div className="result-panel stack">
        <h2 style={{ margin: 0 }}>Run over</h2>
        <div className="row" style={{ gap: "var(--s-6)" }}>
          <div className="stat">
            <span className="stat__value">{phase.cleared}</span>
            <span className="stat__label">waves cleared</span>
          </div>
          <div className="stat">
            <span className="stat__value">{endless?.best_wave ?? 0}</span>
            <span className="stat__label">best</span>
          </div>
        </div>
        <button onClick={() => navigate("/")}>Home</button>
      </div>
    );
  }

  if (phase.kind === "fighting") {
    const config: BattleConfig = {
      seed: seed + wave,
      party,
      waves: [endlessWave(wave, seed)],
    };
    return (
      <BattleView
        key={wave}
        config={config}
        title={`Endless · Wave ${wave}`}
        onFinish={onFinish}
        onExit={() => setPhase({ kind: "done", cleared: wave - 1 })}
      />
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>Endless</h1>
      </div>
      <div className="panel--raised stack">
        <div className="row" style={{ gap: "var(--s-6)" }}>
          <div className="stat">
            <span className="stat__value">{wave}</span>
            <span className="stat__label">current wave</span>
          </div>
          <div className="stat">
            <span className="stat__value">{endless?.best_wave ?? 0}</span>
            <span className="stat__label">best</span>
          </div>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: "var(--fs-sm)" }}>
          Teams start each wave at full strength; enemies keep scaling.
        </p>
        <div className="row">
          <button onClick={() => setPhase({ kind: "fighting" })}>Fight wave {wave}</button>
          {wave > 1 && (
            <button
              className="btn--ghost"
              onClick={async () => {
                await submitEndlessRun(wave - 1);
                await reload();
                setPhase({ kind: "done", cleared: wave - 1 });
              }}
            >
              Bank {wave - 1} &amp; stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
