import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useGameData } from "../game-data/GameDataProvider";
import { RARITIES } from "../game/data/gacha/rarities";
import { tryGetCharacter } from "../game/data/characters";
import { resolveTeam } from "../game/party";
import { assetUrl } from "../ui/assets";

export function Home() {
  const { session } = useAuth();
  const { roster, formation, currencies } = useGameData();

  const username = (session?.user.user_metadata?.username as string | undefined) ?? "Commander";
  const gems = currencies?.gems ?? 0;
  const gold = currencies?.gold ?? 0;
  const xp = currencies?.xp_items ?? 0;

  const leadKey = resolveTeam(roster ?? [], formation ?? [])[0];
  const lead = leadKey ? tryGetCharacter(leadKey) : undefined;

  return (
    <div
      className="menu"
      style={{ "--rarity": lead ? RARITIES[lead.rarity].color : undefined } as React.CSSProperties}
    >
      {lead && <img className="menu__wallpaper" src={assetUrl(lead.art.battle)} alt="" />}

      <div className="menu__hud">
        <span className="menu__name">{username}</span>
        <div className="cluster">
          <span className="chip" title="Gems">💎 {gems}</span>
          <span className="chip" title="Gold">🪙 {gold}</span>
          <span className="chip" title="XP items">📘 {xp}</span>
        </div>
      </div>

      <Link to="/stages" className="menu-btn menu-btn--play">
        Play
      </Link>

      <div className="menu__group menu__group--left">
        <Link to="/formation" className="menu-btn">Team</Link>
        <Link to="/roster" className="menu-btn">Roster</Link>
      </div>

      <div className="menu__group menu__group--right">
        <Link to="/gacha" className="menu-btn">Gacha</Link>
        <Link to="/endless" className="menu-btn">Endless</Link>
      </div>

      {!lead && (
        <Link to="/gacha" className="menu-btn menu__center">
          Summon your first unit →
        </Link>
      )}
    </div>
  );
}
