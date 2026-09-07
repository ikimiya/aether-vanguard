import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useGameData } from "../game-data/GameDataProvider";
import { STAGE_ORDER } from "../game/data/stages";
import { PITY, RARITIES } from "../game/data/gacha/rarities";
import { getCharacter } from "../game/data/characters";
import { ACTIVE_SLOTS, TEAM_SIZE, resolveTeam } from "../game/party";
import { assetUrl } from "../ui/assets";
import { IconEndless, IconGacha, IconStages } from "../ui/icons";

export function Home() {
  const { session } = useAuth();
  const { roster, formation, currencies, gachaState, endless, clearedStageIds } = useGameData();

  const username = (session?.user.user_metadata?.username as string | undefined) ?? "Commander";
  const owned = roster ?? [];
  const total = STAGE_ORDER.length;
  const cleared = STAGE_ORDER.filter((id) => clearedStageIds.has(id)).length;
  const gems = currencies?.gems ?? 0;
  const bestWave = endless?.best_wave ?? 0;

  const team = resolveTeam(owned, formation ?? []);
  const byKey = new Map(owned.map((o) => [o.character_key, o]));

  return (
    <div className="stack">
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--fs-xl)" }}>Welcome back, {username}</h1>
        <div className="cluster" style={{ marginTop: "var(--s-2)" }}>
          <span className="chip">{owned.length} units</span>
          <span className="chip">{cleared}/{total} stages</span>
          <span className="chip">wave {bestWave}</span>
          <span className="chip">{gems} 💎</span>
        </div>
      </div>

      <section className="panel--raised">
        <div className="page-head" style={{ marginBottom: "var(--s-3)" }}>
          <h2 style={{ margin: 0 }}>Your Team</h2>
          <Link to="/formation">Edit →</Link>
        </div>

        <div className="team-strip">
          {team.map((key, i) => {
            const c = getCharacter(key);
            const o = byKey.get(key);
            const active = i < ACTIVE_SLOTS;
            return (
              <Link
                key={key}
                to={`/roster/${key}`}
                className="card card--framed"
                style={{ "--rarity": RARITIES[c.rarity].color } as React.CSSProperties}
              >
                <img className="card__img" src={assetUrl(c.art.portrait)} alt={c.name} />
                <div className="card__name truncate">{c.name}</div>
                <div className="card__meta">Lv {o?.level ?? 1}</div>
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    color: active ? "var(--accent-2)" : "var(--text-faint)",
                  }}
                >
                  {active ? "Active" : "Bench"}
                </div>
              </Link>
            );
          })}
          {Array.from({ length: TEAM_SIZE - team.length }, (_, i) => (
            <Link
              key={`empty-${i}`}
              to="/formation"
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 0,
                opacity: 0.55,
              }}
            >
              <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>+ Add</span>
            </Link>
          ))}
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginTop: "var(--s-3)" }}>
          <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>
            Roster · {owned.length} unit{owned.length === 1 ? "" : "s"}
          </span>
          <Link to="/roster">View →</Link>
        </div>
      </section>

      <div className="mode-grid">
        <Link to="/stages" className="mode-card">
          <IconStages />
          <span className="mode-card__label">Story</span>
          <span className="mode-card__sub">Chapter 1 · {cleared}/{total}</span>
        </Link>
        <Link to="/endless" className="mode-card">
          <IconEndless />
          <span className="mode-card__label">Endless</span>
          <span className="mode-card__sub">Best · wave {bestWave}</span>
        </Link>
        <Link to="/gacha" className="mode-card">
          <IconGacha />
          <span className="mode-card__label">Summon</span>
          <span className="mode-card__sub">
            {gems} 💎 · {gachaState?.pulls_since_5star ?? 0}/{PITY.hard5star}
            {gachaState?.guaranteed_featured ? " · featured" : ""}
          </span>
        </Link>
      </div>
    </div>
  );
}
