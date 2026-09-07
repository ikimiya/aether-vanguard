import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useGameData } from "../game-data/GameDataProvider";
import { STAGE_ORDER } from "../game/data/stages";
import { PITY, RARITIES } from "../game/data/gacha/rarities";
import { tryGetCharacter } from "../game/data/characters";
import { resolveTeam } from "../game/party";
import { assetUrl } from "../ui/assets";

export function Home() {
  const { session } = useAuth();
  const { roster, formation, currencies, gachaState, endless, clearedStageIds } = useGameData();

  const username = (session?.user.user_metadata?.username as string | undefined) ?? "Commander";
  const owned = roster ?? [];
  const total = STAGE_ORDER.length;
  const cleared = STAGE_ORDER.filter((id) => clearedStageIds.has(id)).length;
  const gems = currencies?.gems ?? 0;
  const gold = currencies?.gold ?? 0;
  const xp = currencies?.xp_items ?? 0;
  const bestWave = endless?.best_wave ?? 0;

  const team = resolveTeam(owned, formation ?? []);
  const leadKey = team[0];
  const lead = leadKey ? tryGetCharacter(leadKey) : undefined;

  return (
    <div
      className="menu"
      style={{ "--rarity": lead ? RARITIES[lead.rarity].color : undefined } as React.CSSProperties}
    >
      <div className="menu__hud">
        <span className="menu__name">{username}</span>
        <div className="cluster">
          <span className="chip" title="Gems">💎 {gems}</span>
          <span className="chip" title="Gold">🪙 {gold}</span>
          <span className="chip" title="XP items">📘 {xp}</span>
        </div>
      </div>

      {lead ? (
        <Link to={`/roster/${leadKey}`} className="menu__char" aria-label={`Manage ${lead.name}`}>
          <img src={assetUrl(lead.art.battle)} alt={lead.name} />
        </Link>
      ) : (
        <Link to="/gacha" className="menu__char">
          <span className="muted">Summon your first unit →</span>
        </Link>
      )}

      <Link to="/stages" className="menu-btn menu-btn--play">
        Play
        <small>Chapter 1 · {cleared}/{total} cleared</small>
      </Link>

      <Link to="/formation" className="menu-btn menu-btn--team">
        Team
        <small>{team.length}/5 deployed</small>
      </Link>

      <Link to="/gacha" className="menu-btn menu-btn--gacha">
        Gacha
        <small>
          {gems} 💎 · pity {gachaState?.pulls_since_5star ?? 0}/{PITY.hard5star}
        </small>
      </Link>

      <Link to="/roster" className="menu-btn menu-btn--roster">
        Roster
        <small>{owned.length} unit{owned.length === 1 ? "" : "s"}</small>
      </Link>

      <Link to="/endless" className="menu-btn menu-btn--endless">
        Endless
        <small>best wave {bestWave}</small>
      </Link>
    </div>
  );
}
