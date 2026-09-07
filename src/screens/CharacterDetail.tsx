import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserId } from "../auth/useSession";
import { useGameData } from "../game-data/GameDataProvider";
import { getCharacter } from "../game/data/characters";
import { getSkill } from "../game/data/skills";
import { RARITIES } from "../game/data/gacha/rarities";
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
  const userId = useUserId()!;
  const { roster, currencies, reload } = useGameData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owned = (roster ?? []).find((r) => r.character_key === characterKey);
  if (!owned) return <p>Not owned. <button onClick={() => navigate("/roster")}>Back</button></p>;

  const c = getCharacter(characterKey);
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
    <div>
      <button onClick={() => navigate("/roster")} style={{ background: "var(--panel-2)" }}>
        ← Roster
      </button>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <img
          src={assetUrl(c.art.portrait)}
          alt={c.name}
          style={{ width: 180, borderRadius: 10, border: `2px solid ${RARITIES[c.rarity].color}` }}
        />
        <div style={{ flex: "1 1 240px" }}>
          <h2 style={{ margin: 0 }}>
            {c.name} <span style={{ color: RARITIES[c.rarity].color }}>{RARITIES[c.rarity].label}</span>
          </h2>
          <p style={{ color: "var(--muted)", margin: "0.2rem 0" }}>
            {c.element} · {c.role} · Lv {owned.level}/{cap} · <span style={{ color: "#ffd166" }}>{"★".repeat(owned.star)}</span>
          </p>
          {c.lore && <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{c.lore}</p>}

          <table style={{ borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <tbody>
              {(Object.keys(STAT_LABELS) as (keyof StatBlock)[]).map((k) => (
                <tr key={k}>
                  <td style={{ color: "var(--muted)", paddingRight: "1rem" }}>{STAT_LABELS[k]}</td>
                  <td>{stats[k]}</td>
                  {nextStats && (
                    <td style={{ color: "#69f0ae", paddingLeft: "0.75rem" }}>
                      +{nextStats[k] - stats[k]}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p style={{ color: "#ff8080" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <button
          disabled={busy || !canLevel}
          onClick={() => run(() => levelUpCharacter(userId, owned.id, characterKey, owned.level + 1))}
        >
          {lvlCost
            ? `Level up (🪙 ${lvlCost.gold} · 📘 ${lvlCost.xp_items})`
            : "Max level"}
        </button>
        <button
          disabled={busy || !canStar}
          style={{ background: "var(--panel-2)" }}
          onClick={() => run(() => starUpCharacter(userId, owned.id))}
        >
          {starCost !== null ? `Star up (${owned.dupe_shards}/${starCost} shards)` : "Max star"}
        </button>
      </div>

      <h3>Skills</h3>
      <ul style={{ color: "var(--muted)" }}>
        {c.skills.map((id) => {
          const s = getSkill(id);
          return (
            <li key={id}>
              <strong style={{ color: "var(--text)" }}>{s.name}</strong> — {s.description} ({s.mpCost} MP)
            </li>
          );
        })}
      </ul>
    </div>
  );
}
