import { Link } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { getCharacter, tryGetCharacter } from "../game/data/characters";
import { RARITIES } from "../game/data/gacha/rarities";
import { ELEMENT_COLORS } from "../game/data/elements";
import { assetUrl } from "../ui/assets";

export function Roster() {
  const { roster } = useGameData();
  const all = roster ?? [];
  const owned = all
    .filter((o) => tryGetCharacter(o.character_key))
    .sort((a, b) => {
      const ra = getCharacter(a.character_key).rarity;
      const rb = getCharacter(b.character_key).rarity;
      return rb - ra || b.level - a.level;
    });
  const hidden = all.length - owned.length;

  if (owned.length === 0) return <p className="muted">No units yet — try the Gacha.</p>;

  return (
    <div>
      <div className="page-head">
        <h1>Roster</h1>
        <span className="chip">{owned.length} units</span>
      </div>
      {hidden > 0 && (
        <p className="faint" style={{ fontSize: "0.8rem" }}>
          {hidden} unit{hidden === 1 ? "" : "s"} hidden — unrecognized character data.
        </p>
      )}
      <div className="card-grid" style={{ "--card-min": "132px" } as React.CSSProperties}>
        {owned.map((o) => {
          const c = getCharacter(o.character_key);
          return (
            <Link
              key={o.id}
              to={`/roster/${o.character_key}`}
              className="card card--framed"
              style={{ "--rarity": RARITIES[c.rarity].color } as React.CSSProperties}
            >
              <img className="card__img" src={assetUrl(c.art.portrait)} alt={c.name} />
              <div className="card__name">{c.name}</div>
              <div className="card__meta">
                Lv {o.level} · <span style={{ color: "var(--gold)" }}>{"★".repeat(o.star)}</span>
              </div>
              <div style={{ fontSize: "var(--fs-xs)", color: ELEMENT_COLORS[c.element] }}>{c.element}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
