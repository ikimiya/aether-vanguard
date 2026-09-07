import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserId } from "../auth/useSession";
import { useGameData } from "../game-data/GameDataProvider";
import { BattleView, type BattleResult } from "../battle/BattleView";
import type { BattleConfig } from "../game/engine";
import { endlessWave } from "../game/endless";
import { suggestTeam, toParty } from "../game/party";
import { submitEndlessRun } from "../lib/operations";

type Phase = { kind: "briefing" } | { kind: "fighting" } | { kind: "done"; cleared: number };

export function Endless() {
  const navigate = useNavigate();
  const userId = useUserId()!;
  const { roster, endless, reload } = useGameData();
  const [seed] = useState(() => Date.now() % 1_000_000);
  const [wave, setWave] = useState(1);
  const [phase, setPhase] = useState<Phase>({ kind: "briefing" });

  const party = useMemo(
    () => (roster ? toParty(roster, suggestTeam(roster)) : []),
    [roster],
  );

  if (party.length === 0) {
    return <p>No deployable units. <button onClick={() => navigate("/gacha")}>Gacha</button></p>;
  }

  async function onFinish(result: BattleResult) {
    if (result.won) {
      setWave((w) => w + 1);
      setPhase({ kind: "briefing" });
      return;
    }
    const cleared = wave - 1;
    await submitEndlessRun(userId, cleared);
    await reload();
    setPhase({ kind: "done", cleared });
  }

  if (phase.kind === "done") {
    return (
      <div style={{ background: "var(--panel)", borderRadius: 12, padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>Run over</h2>
        <p>You cleared {phase.cleared} wave{phase.cleared === 1 ? "" : "s"}.</p>
        <p style={{ color: "var(--muted)" }}>Best: {endless?.best_wave ?? 0}</p>
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
      <h2 style={{ marginTop: 0 }}>Endless</h2>
      <p style={{ color: "var(--muted)" }}>
        Wave {wave} · best {endless?.best_wave ?? 0}. Teams start each wave at full strength; enemies keep scaling.
      </p>
      <button onClick={() => setPhase({ kind: "fighting" })}>Fight wave {wave}</button>{" "}
      {wave > 1 && (
        <button
          style={{ background: "var(--panel-2)" }}
          onClick={async () => {
            await submitEndlessRun(userId, wave - 1);
            await reload();
            setPhase({ kind: "done", cleared: wave - 1 });
          }}
        >
          Bank {wave - 1} & stop
        </button>
      )}
    </div>
  );
}
