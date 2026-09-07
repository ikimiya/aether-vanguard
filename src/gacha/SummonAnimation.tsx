import { useEffect, useState } from "react";
import { getCharacter } from "../game/data/characters";
import { RARITIES } from "../game/data/gacha/rarities";
import type { PullOutcome } from "../game/gacha";
import { assetUrl } from "../ui/assets";

type Phase = "charge" | "burst" | "reveal";

const reducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Genshin-style summon sequence: a rarity-tinted orb charges, bursts, then each
 * pulled unit is revealed one at a time (tap to advance). "Skip" jumps straight
 * to the results grid. Honours prefers-reduced-motion by skipping outright.
 */
export function SummonAnimation({
  outcomes,
  onDone,
}: {
  outcomes: PullOutcome[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("charge");
  const [index, setIndex] = useState(0);

  const bestRarity = outcomes.reduce((m, o) => Math.max(m, o.rarity), 3);
  const themeColor = RARITIES[bestRarity as 3 | 4 | 5].color;

  useEffect(() => {
    if (reducedMotion || outcomes.length === 0) onDone();
  }, [outcomes.length, onDone]);

  useEffect(() => {
    if (phase === "charge") {
      const t = setTimeout(() => setPhase("burst"), 950);
      return () => clearTimeout(t);
    }
    if (phase === "burst") {
      const t = setTimeout(() => setPhase("reveal"), 650);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (reducedMotion || outcomes.length === 0) return null;

  function advance() {
    if (phase !== "reveal") {
      setPhase("reveal");
      return;
    }
    if (index < outcomes.length - 1) setIndex((i) => i + 1);
    else onDone();
  }

  return (
    <div
      onClick={advance}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "radial-gradient(circle at 50% 42%, #10131f, #05060a 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          animation: "twinkle 3s ease-in-out infinite",
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(2px 2px at 42% 82%, #fff, transparent), radial-gradient(1px 1px at 88% 22%, #fff, transparent), radial-gradient(1px 1px at 55% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 33% 55%, #fff, transparent)",
        }}
      />

      {phase === "charge" && (
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, #fff, ${themeColor} 58%, transparent 72%)`,
            filter: `drop-shadow(0 0 45px ${themeColor})`,
            animation: "summonCharge 0.95s ease-in forwards",
          }}
        />
      )}

      {phase === "burst" && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "summonFlash 0.65s ease-out forwards" }} />
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: themeColor,
              animation: "summonShock 0.65s ease-out forwards",
            }}
          />
        </>
      )}

      {phase === "reveal" && <RevealCard key={index} outcome={outcomes[index]} />}

      {phase === "reveal" && (
        <>
          <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", color: "var(--muted)", fontSize: "0.8rem" }}>
            {index + 1} / {outcomes.length}
          </div>
          <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", color: "var(--muted)", fontSize: "0.8rem" }}>
            tap to continue
          </div>
        </>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
        style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.14)", fontSize: "0.85rem" }}
      >
        Skip →
      </button>
    </div>
  );
}

function RevealCard({ outcome }: { outcome: PullOutcome }) {
  const c = getCharacter(outcome.characterId);
  const color = RARITIES[outcome.rarity].color;
  const legendary = outcome.rarity === 5;

  return (
    <div style={{ position: "relative", textAlign: "center", animation: "revealPop 0.5s cubic-bezier(.2,.9,.3,1.3) both" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          width: 340,
          height: 340,
          transform: "translate(-50%,-50%)",
          background: `radial-gradient(circle, ${color}66, transparent 68%)`,
          animation: legendary ? "glowPulse 1.6s ease-in-out infinite" : undefined,
        }}
      />
      <img
        src={assetUrl(c.art.portrait)}
        alt={c.name}
        style={{
          position: "relative",
          width: 200,
          borderRadius: 12,
          border: `3px solid ${color}`,
          boxShadow: `0 0 28px ${color}, 0 0 64px ${color}80`,
        }}
      />
      <div style={{ position: "relative", marginTop: "0.6rem", fontSize: "1.2rem", fontWeight: 700, color: "var(--text)" }}>
        {c.name}
      </div>
      <div style={{ position: "relative", color, letterSpacing: 3, fontSize: "1.1rem" }}>
        {"★".repeat(outcome.rarity)}
      </div>
      <div style={{ position: "relative", marginTop: "0.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>
        {outcome.isNew ? "NEW" : `+${outcome.dupeShards} shards`}
        {outcome.isFeatured ? " · Featured" : ""}
      </div>
    </div>
  );
}
