import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { getCharacter } from "../game/data/characters";
import { getSkill } from "../game/data/skills";
import { RARITIES } from "../game/data/gacha/rarities";
import { ELEMENT_COLORS } from "../game/data/elements";
import { computeStats, levelCap, levelUpCost, starUpCost } from "../game/progression";
import { levelUpCharacter, starUpCharacter } from "../lib/operations";
import { assetUrl } from "../ui/assets";
import type { StatBlock } from "../game/types";

const STAT_LABELS: Record<keyof StatBlock, string> = {
  hp: "HP",
  atk: "ATK",
  matk: "M.ATK",
  def: "DEF",
  mdef: "M.DEF",
  spd: "SPD",
};

export function CharacterDetail() {
  const { characterKey = "" } = useParams();
  const navigate = useNavigate();
  const { roster, currencies, reload } = useGameData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owned = (roster ?? []).find((r) => r.character_key === characterKey);
  if (!owned)
    return (
      <p className="row">
        Not owned. <button className="btn--sm" onClick={() => navigate("/roster")}>Back</button>
      </p>
    );

  const c = getCharacter(characterKey);
  const rarity = RARITIES[c.rarity].color;
  const cap = levelCap(c.rarity);
  const stats = computeStats(c, owned.level, owned.star);
  const nextStats = owned.level < cap ? computeStats(c, owned.level + 1, owned.star) : null;
  const lvlCost = owned.level < cap ? levelUpCost(owned.level) : null;
  const canLevel =
    !!lvlCost &&
    (currencies?.gold ?? 0) >= lvlCost.gold &&
    (currencies?.xp_items ?? 0) >= lvlCost.xp_items;
  const starCost = starUpCost(owned.star);
  const canStar = starCost !== null && owned.dupe_shards >= starCost;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button className="btn--ghost btn--sm" onClick={() => navigate("/roster")}>
        ← Roster
      </button>

      <div className="panel--raised" style={{ display: "flex", gap: "var(--s-5)", flexWrap: "wrap" }}>
        <img
          src={assetUrl(c.art.portrait)}
          alt={c.name}
          style={{
            width: "min(200px, 42vw)",
            borderRadius: "var(--r-md)",
            border: `2px solid ${rarity}`,
          }}
        />
        <div style={{ flex: "1 1 240px" }}>
          <h2 style={{ margin: 0 }}>
            {c.name}{" "}
            <span style={{ color: rarity }}>{RARITIES[c.rarity].label}</span>
          </h2>
          <div className="cluster" style={{ margin: "var(--s-2) 0" }}>
            <span className="chip" style={{ color: ELEMENT_COLORS[c.element] }}>{c.element}</span>
            <span className="chip">{c.role}</span>
            <span className="chip">Lv {owned.level}/{cap}</span>
            <span className="chip" style={{ color: "var(--gold)" }}>{"★".repeat(owned.star)}</span>
          </div>
          {c.lore && <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>{c.lore}</p>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: "var(--s-1) var(--s-4)",
              fontSize: "var(--fs-sm)",
              maxWidth: 260,
            }}
          >
            {(Object.keys(STAT_LABELS) as (keyof StatBlock)[]).map((k) => (
              <div key={k} style={{ display: "contents" }}>
                <span className="muted">{STAT_LABELS[k]}</span>
                <span>{stats[k]}</span>
                <span style={{ color: "var(--good)" }}>
                  {nextStats ? `+${nextStats[k] - stats[k]}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}

      <div className="row">
        <button
          disabled={busy || !canLevel}
          onClick={() => run(() => levelUpCharacter(owned.id, owned.level + 1))}
        >
          {lvlCost ? `Level up · 🪙 ${lvlCost.gold} · 📘 ${lvlCost.xp_items}` : "Max level"}
        </button>
        <button
          className="btn--ghost"
          disabled={busy || !canStar}
          onClick={() => run(() => starUpCharacter(owned.id))}
        >
          {starCost !== null ? `Star up · ${owned.dupe_shards}/${starCost} shards` : "Max star"}
        </button>
      </div>

      <div>
        <h3>Skills</h3>
        <div className="list">
          {c.skills.map((id) => {
            const s = getSkill(id);
            return (
              <div key={id} className="panel">
                <strong>{s.name}</strong>{" "}
                <span className="chip">{s.mpCost} MP</span>
                <p className="muted" style={{ margin: "var(--s-1) 0 0", fontSize: "var(--fs-sm)" }}>
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
