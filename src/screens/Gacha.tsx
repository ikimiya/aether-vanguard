import { useState } from "react";
import { useGameData } from "../game-data/GameDataProvider";
import { BANNERS } from "../game/data/gacha/banners";
import { getCharacter } from "../game/data/characters";
import { RARITIES } from "../game/data/gacha/rarities";
import { pullBanner } from "../lib/operations";
import type { PullOutcome } from "../game/gacha";
import { assetUrl } from "../ui/assets";
import { SummonAnimation } from "../gacha/SummonAnimation";

export function Gacha() {
  const { currencies, gachaState, reload } = useGameData();
  const [results, setResults] = useState<PullOutcome[] | null>(null);
  const [pending, setPending] = useState<PullOutcome[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pull(bannerId: string, count: number) {
    setBusy(true);
    setError(null);
    try {
      const outcomes = await pullBanner(bannerId, count);
      setPending(outcomes);
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
        <div className="page-head">
          <h1>Results</h1>
        </div>
        {(() => {
          const cols = Math.min(results.length, 5);
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: "var(--s-2)",
                maxWidth: cols * 132,
                margin: "0 auto",
              }}
            >
              {results.map((o, i) => {
                const c = getCharacter(o.characterId);
                return (
                  <div
                    key={i}
                    className="card card--framed"
                    style={{
                      "--rarity": RARITIES[o.rarity].color,
                      padding: "var(--s-2)",
                      animation: "cardReveal 0.35s ease both",
                      animationDelay: `${i * 55}ms`,
                    } as React.CSSProperties}
                  >
                    <img className="card__img" src={assetUrl(c.art.portrait)} alt={c.name} />
                    <div className="card__name truncate">{c.name}</div>
                    <div
                      className="truncate"
                      style={{ fontSize: "var(--fs-xs)", color: RARITIES[o.rarity].color }}
                    >
                      {RARITIES[o.rarity].label}
                      {o.isFeatured ? " ★" : ""}
                    </div>
                    <div className="card__meta truncate">
                      {o.isNew ? "NEW" : `+${o.dupeShards}`}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <button className="btn--ghost" style={{ marginTop: "var(--s-5)" }} onClick={() => setResults(null)}>
          Back to banners
        </button>
      </div>
    );
  }

  return (
    <div>
      {pending && (
        <SummonAnimation
          outcomes={pending}
          onDone={() => {
            setResults(pending);
            setPending(null);
          }}
        />
      )}
      <div className="page-head">
        <h1>Summon</h1>
        {gachaState && (
          <span className="chip">
            {gachaState.pulls_since_5star} since 5★
            {gachaState.guaranteed_featured ? " · featured guaranteed" : ""}
          </span>
        )}
      </div>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="stack">
        {BANNERS.map((b) => {
          const can1 = (currencies?.gems ?? 0) >= b.costPerPull;
          const can10 = (currencies?.gems ?? 0) >= b.costPerPull * 10;
          return (
            <div key={b.id} className="panel" style={{ padding: 0, overflow: "hidden" }}>
              <img src={assetUrl(b.art)} alt={b.name} style={{ width: "100%" }} />
              <div style={{ padding: "var(--s-4)" }}>
                <strong>{b.name}</strong>
                {b.featured[5]?.length ? (
                  <p className="muted" style={{ fontSize: "var(--fs-sm)", margin: "var(--s-2) 0" }}>
                    Rate-up: {b.featured[5].map((id) => getCharacter(id).name).join(", ")}
                  </p>
                ) : null}
                <div className="row" style={{ marginTop: "var(--s-3)" }}>
                  <button disabled={busy || !!pending || !can1} onClick={() => pull(b.id, 1)}>
                    Pull ×1 · {b.costPerPull} 💎
                  </button>
                  <button
                    className="btn--ghost"
                    disabled={busy || !!pending || !can10}
                    onClick={() => pull(b.id, 10)}
                  >
                    Pull ×10 · {b.costPerPull * 10} 💎
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
