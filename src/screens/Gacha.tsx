import { useState } from "react";
import { useGameData } from "../game-data/GameDataProvider";
import { BANNERS } from "../game/data/gacha/banners";
import { getCharacter } from "../game/data/characters";
import { RARITIES } from "../game/data/gacha/rarities";
import { pullBanner } from "../lib/operations";
import type { PullOutcome } from "../game/gacha";
import { assetUrl } from "../ui/assets";

export function Gacha() {
  const { currencies, gachaState, reload } = useGameData();
  const [results, setResults] = useState<PullOutcome[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pull(bannerId: string, count: number) {
    setBusy(true);
    setError(null);
    try {
      const outcomes = await pullBanner(bannerId, count);
      setResults(outcomes);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pull failed");
    } finally {
      setBusy(false);
    }
  }

  if (results) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Results</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.6rem" }}>
          {results.map((o, i) => {
            const c = getCharacter(o.characterId);
            return (
              <div
                key={i}
                style={{
                  border: `2px solid ${RARITIES[o.rarity].color}`,
                  borderRadius: 10,
                  padding: "0.4rem",
                  textAlign: "center",
                  background: "var(--panel)",
                }}
              >
                <img src={assetUrl(c.art.portrait)} alt={c.name} style={{ borderRadius: 6, width: "100%" }} />
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.name}</div>
                <div style={{ fontSize: "0.75rem", color: RARITIES[o.rarity].color }}>
                  {RARITIES[o.rarity].label}
                  {o.isFeatured ? " ★" : ""}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                  {o.isNew ? "NEW" : `+${o.dupeShards} shards`}
                </div>
              </div>
            );
          })}
        </div>
        <button style={{ marginTop: "1rem" }} onClick={() => setResults(null)}>
          Back to banners
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Gacha</h2>
      {gachaState && (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          {gachaState.pulls_since_5star} since last 5★
          {gachaState.guaranteed_featured ? " · next 5★ guaranteed featured" : ""}
        </p>
      )}
      {error && <p style={{ color: "#ff8080" }}>{error}</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {BANNERS.map((b) => {
          const can1 = (currencies?.gems ?? 0) >= b.costPerPull;
          const can10 = (currencies?.gems ?? 0) >= b.costPerPull * 10;
          return (
            <div key={b.id} style={{ background: "var(--panel)", borderRadius: 12, overflow: "hidden" }}>
              <img src={assetUrl(b.art)} alt={b.name} style={{ display: "block", width: "100%" }} />
              <div style={{ padding: "1rem" }}>
                <strong>{b.name}</strong>
                {b.featured[5]?.length ? (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.3rem 0" }}>
                    Rate-up: {b.featured[5].map((id) => getCharacter(id).name).join(", ")}
                  </p>
                ) : null}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button disabled={busy || !can1} onClick={() => pull(b.id, 1)}>
                    Pull ×1 ({b.costPerPull})
                  </button>
                  <button disabled={busy || !can10} onClick={() => pull(b.id, 10)}>
                    Pull ×10 ({b.costPerPull * 10})
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
