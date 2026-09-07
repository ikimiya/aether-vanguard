import { useMemo, useState } from "react";
import { useGameData } from "../game-data/GameDataProvider";
import { useRequiredUserId } from "../auth/useSession";
import { getCharacter, tryGetCharacter } from "../game/data/characters";
import { RARITIES } from "../game/data/gacha/rarities";
import { ELEMENT_COLORS } from "../game/data/elements";
import { ACTIVE_SLOTS, TEAM_SIZE, resolveTeam } from "../game/party";
import { saveFormation } from "../lib/db/profile";
import { assetUrl } from "../ui/assets";

export function Formation() {
  const userId = useRequiredUserId();
  const { roster, formation, reload } = useGameData();
  const owned = useMemo(
    () => (roster ?? []).filter((o) => tryGetCharacter(o.character_key)),
    [roster],
  );
  const saved = useMemo(() => formation ?? [], [formation]);

  const [draft, setDraft] = useState<string[]>(() => resolveTeam(owned, saved));
  const [busy, setBusy] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const canSave = dirty && draft.length > 0 && !busy;

  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (key: string) => setDraft((d) => d.filter((k) => k !== key));
  const add = (key: string) =>
    setDraft((d) => (d.length >= TEAM_SIZE || d.includes(key) ? d : [...d, key]));

  async function persist() {
    setBusy(true);
    try {
      await saveFormation(userId, draft);
      await reload();
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  if (owned.length === 0) return <p>No units yet — try the Gacha.</p>;

  const rosterSorted = [...owned].sort((a, b) => {
    const ra = getCharacter(a.character_key).rarity;
    const rb = getCharacter(b.character_key).rarity;
    return rb - ra || b.level - a.level;
  });

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Team</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 0 }}>
        First {ACTIVE_SLOTS} deploy; the last {TEAM_SIZE - ACTIVE_SLOTS} are the bench for
        mid-battle swaps. Order sets turn priority.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {Array.from({ length: TEAM_SIZE }, (_, slot) => {
          const key = draft[slot];
          const active = slot < ACTIVE_SLOTS;
          const c = key ? getCharacter(key) : null;
          return (
            <div
              key={slot}
              style={{
                width: 116,
                background: "var(--panel)",
                borderRadius: 10,
                border: `2px solid ${c ? RARITIES[c.rarity].color : "#333a4f"}`,
                padding: "0.4rem",
                textAlign: "center",
                opacity: c ? 1 : 0.6,
              }}
            >
              <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                {active ? `Active ${slot + 1}` : "Bench"}
              </div>
              {c ? (
                <>
                  <img
                    src={assetUrl(c.art.portrait)}
                    alt={c.name}
                    style={{ borderRadius: 6, width: "100%" }}
                  />
                  <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{c.name}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.25rem", marginTop: "0.3rem" }}>
                    <button style={slotBtn} disabled={slot === 0} onClick={() => move(slot, -1)}>
                      ◀
                    </button>
                    <button
                      style={slotBtn}
                      disabled={slot >= draft.length - 1}
                      onClick={() => move(slot, 1)}
                    >
                      ▶
                    </button>
                    <button style={slotBtn} onClick={() => remove(key)}>
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ padding: "1.5rem 0", color: "var(--muted)" }}>Empty</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "1rem" }}>
        <button disabled={!canSave} onClick={persist}>
          {busy ? "Saving…" : "Save team"}
        </button>
        <button
          style={{ background: "var(--panel-2)" }}
          disabled={!dirty || busy}
          onClick={() => setDraft(resolveTeam(owned, saved))}
        >
          Reset
        </button>
        {savedTick && <span style={{ color: "var(--accent-2)", fontSize: "0.85rem" }}>Saved ✓</span>}
      </div>

      <h3 style={{ margin: "0 0 0.5rem" }}>Roster</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.6rem" }}>
        {rosterSorted.map((o) => {
          const c = getCharacter(o.character_key);
          const picked = draft.includes(o.character_key);
          const full = draft.length >= TEAM_SIZE;
          return (
            <button
              key={o.id}
              onClick={() => (picked ? remove(o.character_key) : add(o.character_key))}
              disabled={!picked && full}
              style={{
                background: "var(--panel)",
                color: "var(--text)",
                borderRadius: 10,
                border: `2px solid ${picked ? "var(--accent-2)" : RARITIES[c.rarity].color}`,
                padding: "0.4rem",
                textAlign: "center",
                opacity: picked ? 0.55 : 1,
              }}
            >
              <img src={assetUrl(c.art.portrait)} alt={c.name} style={{ borderRadius: 6, width: "100%" }} />
              <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{c.name}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                Lv {o.level} · <span style={{ color: "#ffd166" }}>{"★".repeat(o.star)}</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: ELEMENT_COLORS[c.element] }}>
                {picked ? "On team" : c.element}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const slotBtn: React.CSSProperties = {
  padding: "0.15rem 0.35rem",
  fontSize: "0.75rem",
  background: "var(--panel-2)",
  borderRadius: 6,
};
