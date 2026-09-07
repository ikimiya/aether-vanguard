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

  if (owned.length === 0) return <p className="muted">No units yet — try the Gacha.</p>;

  const rosterSorted = [...owned].sort((a, b) => {
    const ra = getCharacter(a.character_key).rarity;
    const rb = getCharacter(b.character_key).rarity;
    return rb - ra || b.level - a.level;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Team</h1>
          <p>
            First {ACTIVE_SLOTS} deploy; the last {TEAM_SIZE - ACTIVE_SLOTS} bench for mid-battle
            swaps. Order sets turn priority.
          </p>
        </div>
      </div>

      <div className="card-grid" style={{ "--card-min": "116px", marginBottom: "var(--s-4)" } as React.CSSProperties}>
        {Array.from({ length: TEAM_SIZE }, (_, slot) => {
          const key = draft[slot];
          const active = slot < ACTIVE_SLOTS;
          const c = key ? getCharacter(key) : null;
          return (
            <div
              key={slot}
              className="card card--framed"
              style={{
                "--rarity": c ? RARITIES[c.rarity].color : "var(--line-strong)",
                opacity: c ? 1 : 0.6,
              } as React.CSSProperties}
            >
              <div className="card__meta" style={{ marginBottom: "var(--s-1)" }}>
                {active ? `Active ${slot + 1}` : "Bench"}
              </div>
              {c ? (
                <>
                  <img className="card__img" src={assetUrl(c.art.portrait)} alt={c.name} />
                  <div className="card__name">{c.name}</div>
                  <div className="cluster" style={{ justifyContent: "center", marginTop: "var(--s-2)" }}>
                    <button className="btn--ghost btn--sm" disabled={slot === 0} onClick={() => move(slot, -1)}>
                      ◀
                    </button>
                    <button
                      className="btn--ghost btn--sm"
                      disabled={slot >= draft.length - 1}
                      onClick={() => move(slot, 1)}
                    >
                      ▶
                    </button>
                    <button className="btn--ghost btn--sm" onClick={() => remove(key)}>
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <div className="muted" style={{ padding: "var(--s-6) 0" }}>Empty</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="row" style={{ marginBottom: "var(--s-5)" }}>
        <button disabled={!canSave} onClick={persist}>
          {busy ? "Saving…" : "Save team"}
        </button>
        <button
          className="btn--ghost"
          disabled={!dirty || busy}
          onClick={() => setDraft(resolveTeam(owned, saved))}
        >
          Reset
        </button>
        {savedTick && <span className="chip chip--accent">Saved ✓</span>}
      </div>

      <h3>Roster</h3>
      <div className="card-grid" style={{ "--card-min": "112px" } as React.CSSProperties}>
        {rosterSorted.map((o) => {
          const c = getCharacter(o.character_key);
          const picked = draft.includes(o.character_key);
          const full = draft.length >= TEAM_SIZE;
          return (
            <button
              key={o.id}
              className="card card--framed"
              onClick={() => (picked ? remove(o.character_key) : add(o.character_key))}
              disabled={!picked && full}
              style={{
                "--rarity": picked ? "var(--accent-2)" : RARITIES[c.rarity].color,
                background: "var(--surface-1)",
                minHeight: 0,
                opacity: picked ? 0.6 : 1,
              } as React.CSSProperties}
            >
              <img className="card__img" src={assetUrl(c.art.portrait)} alt={c.name} />
              <div className="card__name">{c.name}</div>
              <div className="card__meta">
                Lv {o.level} · <span style={{ color: "var(--gold)" }}>{"★".repeat(o.star)}</span>
              </div>
              <div style={{ fontSize: "var(--fs-xs)", color: ELEMENT_COLORS[c.element] }}>
                {picked ? "On team" : c.element}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
