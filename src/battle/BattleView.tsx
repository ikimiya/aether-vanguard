import { useMemo, useState } from "react";
import type { BattleConfig, BattleState, PlayerAction, Unit } from "../game/engine";
import {
  activeUnit,
  affordableSkills,
  benchPlayers,
  createBattle,
  fieldPlayers,
  isSingleTarget,
  livingEnemies,
  submitAction,
  submitSwap,
} from "../game/engine";
import { getSkill } from "../game/data/skills";
import { PhaserBattle } from "../phaser/PhaserBattle";
import { useHoldBattleLock } from "./BattleLock";

export interface BattleResult {
  won: boolean;
  rounds: number;
  noDeaths: boolean;
}

type Targeting = { action: PlayerAction; pool: Unit[] } | null;

export function BattleView({
  config,
  title,
  onFinish,
  onExit,
}: {
  config: BattleConfig;
  title: string;
  onFinish: (result: BattleResult) => void;
  onExit: () => void;
}) {
  const [state, setState] = useState<BattleState>(() => createBattle(config));
  const [targeting, setTargeting] = useState<Targeting>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  useHoldBattleLock();

  const active = activeUnit(state);
  const terminal =
    state.phase === "victory" ? true : state.phase === "defeat" ? false : null;

  function apply(action: PlayerAction) {
    setTargeting(null);
    setState((s) => submitAction(s, action));
  }

  function chooseAction(action: PlayerAction) {
    if (action.kind === "defend") return apply(action);
    if (action.kind === "attack") {
      return setTargeting({ action, pool: livingEnemies(state) });
    }
    const skill = getSkill(action.skillId);
    if (!isSingleTarget(skill)) return apply(action);
    const pool =
      skill.target === "one-ally"
        ? fieldPlayers(state).filter((u) => u.alive)
        : livingEnemies(state);
    setTargeting({ action, pool });
  }

  const skills = useMemo(() => (active ? affordableSkills(active) : []), [active]);
  const lockedSkills = useMemo(
    () => (active ? active.skills.map(getSkill).filter((s) => active.mp < s.mpCost) : []),
    [active],
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: "0 0 0.5rem" }}>{title}</h2>
        <span style={{ color: "var(--muted)" }}>Round {state.round}</span>
      </div>

      <PhaserBattle config={config} state={state} />

      <div style={{ marginTop: "0.75rem", minHeight: 120 }}>
        {terminal !== null ? (
          <ResultPanel
            won={terminal}
            rounds={state.round}
            noDeaths={state.playerDeaths === 0}
            onContinue={() =>
              onFinish({ won: terminal, rounds: state.round, noDeaths: state.playerDeaths === 0 })
            }
          />
        ) : state.phase === "needs-swap" ? (
          <SwapPanel
            slot={state.swapSlot ?? 0}
            bench={benchPlayers(state)}
            onSwap={(uid) => {
              setTargeting(null);
              setState((s) => submitSwap(s, uid));
            }}
          />
        ) : targeting ? (
          <TargetPanel
            pool={targeting.pool}
            onPick={(uid) => apply({ ...targeting.action, targetUid: uid } as PlayerAction)}
            onCancel={() => setTargeting(null)}
          />
        ) : active ? (
          <ActionPanel
            unit={active}
            skills={skills}
            lockedSkills={lockedSkills}
            onAttack={() => chooseAction({ kind: "attack" })}
            onDefend={() => chooseAction({ kind: "defend" })}
            onSkill={(id) => chooseAction({ kind: "skill", skillId: id })}
          />
        ) : (
          <p style={{ color: "var(--muted)" }}>Resolving…</p>
        )}
      </div>

      {terminal === null &&
        (confirmExit ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ color: "var(--muted)" }}>Forfeit this battle?</span>
            <button onClick={onExit} style={{ background: "#a33333" }}>
              Confirm retreat
            </button>
            <button onClick={() => setConfirmExit(false)} style={{ background: "var(--panel-2)" }}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmExit(true)}
            style={{ background: "var(--panel-2)", marginTop: "0.5rem" }}
          >
            Retreat
          </button>
        ))}
    </div>
  );
}

function ActionPanel({
  unit,
  skills,
  lockedSkills,
  onAttack,
  onDefend,
  onSkill,
}: {
  unit: Unit;
  skills: ReturnType<typeof getSkill>[];
  lockedSkills: ReturnType<typeof getSkill>[];
  onAttack: () => void;
  onDefend: () => void;
  onSkill: (id: string) => void;
}) {
  return (
    <div>
      <p style={{ margin: "0 0 0.4rem", color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }}>{unit.name}</strong> · MP {unit.mp}/{unit.maxMp}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={onAttack}>Attack</button>
        <button onClick={onDefend} style={{ background: "var(--panel-2)" }}>
          Defend
        </button>
        {skills.map((s) => (
          <button key={s.id} onClick={() => onSkill(s.id)} title={s.description}>
            {s.name} <small>({s.mpCost})</small>
          </button>
        ))}
        {lockedSkills.map((s) => (
          <button key={s.id} disabled title={`Needs ${s.mpCost} MP`}>
            {s.name} <small>({s.mpCost})</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function TargetPanel({
  pool,
  onPick,
  onCancel,
}: {
  pool: Unit[];
  onPick: (uid: string) => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <p style={{ margin: "0 0 0.4rem", color: "var(--muted)" }}>Choose a target</p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {pool.map((u) => (
          <button key={u.uid} onClick={() => onPick(u.uid)}>
            {u.name} <small>({u.hp}/{u.stats.hp})</small>
          </button>
        ))}
        <button onClick={onCancel} style={{ background: "var(--panel-2)" }}>
          Back
        </button>
      </div>
    </div>
  );
}

function SwapPanel({
  slot,
  bench,
  onSwap,
}: {
  slot: number;
  bench: Unit[];
  onSwap: (uid: string) => void;
}) {
  return (
    <div>
      <p style={{ margin: "0 0 0.4rem", color: "var(--muted)" }}>
        Slot {slot + 1} is down — send in a reserve
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {bench.map((u) => (
          <button key={u.uid} onClick={() => onSwap(u.uid)}>
            {u.name} <small>({u.hp}/{u.stats.hp})</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  won,
  rounds,
  noDeaths,
  onContinue,
}: {
  won: boolean;
  rounds: number;
  noDeaths: boolean;
  onContinue: () => void;
}) {
  return (
    <div style={{ background: "var(--panel)", borderRadius: 10, padding: "1rem" }}>
      <h3 style={{ margin: "0 0 0.3rem" }}>{won ? "Victory" : "Defeat"}</h3>
      <p style={{ margin: "0 0 0.6rem", color: "var(--muted)" }}>
        {rounds} round{rounds === 1 ? "" : "s"}
        {won && noDeaths ? " · flawless" : ""}
      </p>
      <button onClick={onContinue}>Continue</button>
    </div>
  );
}
