import { Link } from "react-router-dom";
import { useGameData } from "../game-data/GameDataProvider";
import { getCharacter } from "../game/data/characters";
import { RARITIES } from "../game/data/gacha/rarities";
import { ELEMENT_COLORS } from "../game/data/elements";
import { assetUrl } from "../ui/assets";

export function Roster() {
  const { roster } = useGameData();
  const owned = [...(roster ?? [])].sort((a, b) => {
    const ra = getCharacter(a.character_key).rarity;
    const rb = getCharacter(b.character_key).rarity;
    return rb - ra || b.level - a.level;
  });

  if (owned.length === 0) return <p>No units yet — try the Gacha.</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Roster ({owned.length})</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.6rem" }}>
        {owned.map((o) => {
          const c = getCharacter(o.character_key);
          return (
            <Link
              key={o.id}
              to={`/roster/${o.character_key}`}
              style={{
                textDecoration: "none",
                color: "var(--text)",
                background: "var(--panel)",
                borderRadius: 10,
                border: `2px solid ${RARITIES[c.rarity].color}`,
                padding: "0.4rem",
                textAlign: "center",
              }}
            >
              <img src={assetUrl(c.art.portrait)} alt={c.name} style={{ borderRadius: 6 }} />
              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Lv {o.level} · <span style={{ color: "#ffd166" }}>{"★".repeat(o.star)}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: ELEMENT_COLORS[c.element] }}>{c.element}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
