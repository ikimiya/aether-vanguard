import Phaser from "phaser";
import type { BattleConfig, BattleEvent, BattleState, Unit } from "../../game/engine";
import { getEnemy } from "../../game/data/enemies";
import { getCharacter } from "../../game/data/characters";
import { ELEMENT_COLORS } from "../../game/data/elements";

const W = 900;
const H = 506;

const assetUrl = (p: string) => import.meta.env.BASE_URL + p;

interface UnitView {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBarBg: Phaser.GameObjects.Rectangle;
  mpBar?: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  marker: Phaser.GameObjects.Text;
}

export class BattleScene extends Phaser.Scene {
  private views = new Map<string, UnitView>();
  private logCursor = 0;

  constructor() {
    super("battle");
  }

  preload() {
    const config = this.game.registry.get("config") as BattleConfig;
    for (const m of config.party) {
      const c = getCharacter(m.characterId);
      this.load.image(`char:${c.id}`, assetUrl(c.art.battle));
    }
    const enemyIds = new Set(config.waves.flat().map((w) => w.enemyId));
    for (const id of enemyIds) {
      this.load.image(`enemy:${id}`, assetUrl(getEnemy(id).art.battle));
    }
  }

  create() {
    this.add.rectangle(0, 0, W, H, 0x12151f).setOrigin(0);
    this.add.rectangle(0, H * 0.62, W, H * 0.38, 0x1c2130).setOrigin(0);
    const initial = this.game.registry.get("state") as BattleState | undefined;
    if (initial) this.syncState(initial, true);
  }

  private textureKeyFor(unit: Unit): string {
    return unit.side === "player" ? `char:${unit.sourceId}` : `enemy:${unit.sourceId}`;
  }

  private slotPosition(unit: Unit, enemyCount: number): { x: number; y: number } {
    if (unit.side === "player") {
      const xs = [170, 300, 430];
      return { x: xs[unit.slot] ?? 170, y: 360 };
    }
    const span = Math.min(enemyCount, 4);
    const startX = 600;
    const gap = span > 1 ? 220 / (span - 1) : 0;
    return { x: startX + (unit.slot % span) * gap, y: 150 + (unit.slot % 2) * 34 };
  }

  private buildView(unit: Unit): UnitView {
    const container = this.add.container(0, 0);
    const hasTex = this.textures.exists(this.textureKeyFor(unit));
    const spriteH = unit.side === "player" ? 150 : unit.isBoss ? 176 : 120;
    // Players stand on the container origin; enemies are centred on it so their
    // sprites never clip the top of the canvas.
    const originY = unit.side === "player" ? 1 : 0.5;
    const topY = unit.side === "player" ? -spriteH : -spriteH / 2;
    const bottomY = unit.side === "player" ? 0 : spriteH / 2;

    let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    if (hasTex) {
      const img = this.add.image(0, 0, this.textureKeyFor(unit)).setOrigin(0.5, originY);
      img.setScale(spriteH / img.height);
      sprite = img;
    } else {
      const color = Phaser.Display.Color.HexStringToColor(ELEMENT_COLORS[unit.element]).color;
      sprite = this.add.rectangle(0, 0, spriteH * 0.7, spriteH, color).setOrigin(0.5, originY);
    }

    const barW = 84;
    const barY = bottomY + 6;
    const hpBarBg = this.add.rectangle(0, barY, barW, 8, 0x000000, 0.6).setOrigin(0.5, 0);
    const hpBar = this.add.rectangle(-barW / 2, barY, barW, 8, 0x4ade80).setOrigin(0, 0);
    const nameText = this.add
      .text(0, topY - 8, unit.name, { fontFamily: "system-ui, sans-serif", fontSize: "13px", color: "#e7e9f0" })
      .setOrigin(0.5, 1);
    const marker = this.add
      .text(0, topY - 26, "", { fontFamily: "system-ui, sans-serif", fontSize: "16px", color: "#ffd166" })
      .setOrigin(0.5, 1);

    const parts: Phaser.GameObjects.GameObject[] = [sprite, hpBarBg, hpBar, nameText, marker];
    let mpBar: Phaser.GameObjects.Rectangle | undefined;
    if (unit.side === "player") {
      const mpBg = this.add.rectangle(0, barY + 10, barW, 5, 0x000000, 0.6).setOrigin(0.5, 0);
      mpBar = this.add.rectangle(-barW / 2, barY + 10, barW, 5, 0x60a5fa).setOrigin(0, 0);
      parts.push(mpBg, mpBar);
    }
    container.add(parts);
    return { container, sprite, hpBar, hpBarBg, nameText, marker, mpBar };
  }

  /** Redraw every unit to match state, then play new log events as floating text. */
  syncState(state: BattleState, immediate = false) {
    const enemyCount = state.enemies.length;
    const units = [...state.players, ...state.enemies];
    const seen = new Set<string>();

    for (const unit of units) {
      if (unit.side === "player" && (unit.slot < 0 || unit.slot > 2)) continue;
      seen.add(unit.uid);
      let view = this.views.get(unit.uid);
      if (!view) {
        view = this.buildView(unit);
        this.views.set(unit.uid, view);
      }
      const pos = this.slotPosition(unit, enemyCount);
      view.container.setPosition(pos.x, pos.y);

      const hpRatio = Phaser.Math.Clamp(unit.hp / unit.stats.hp, 0, 1);
      view.hpBar.width = 84 * hpRatio;
      view.hpBar.fillColor = hpRatio > 0.5 ? 0x4ade80 : hpRatio > 0.2 ? 0xfacc15 : 0xef4444;
      if (view.mpBar) view.mpBar.width = 84 * Phaser.Math.Clamp(unit.mp / unit.maxMp, 0, 1);

      view.container.setAlpha(unit.alive ? 1 : 0.25);
      const isActive = state.activeUid === unit.uid;
      view.marker.setText(isActive ? "▼" : unit.defending ? "🛡" : "");
    }

    for (const [uid, view] of this.views) {
      if (!seen.has(uid)) {
        view.container.destroy();
        this.views.delete(uid);
      }
    }

    const fresh = state.log.slice(this.logCursor);
    this.logCursor = state.log.length;
    if (!immediate) fresh.forEach((e, i) => this.time.delayedCall(i * 120, () => this.flashEvent(e)));
  }

  private flashEvent(e: BattleEvent) {
    if (e.t === "damage" || e.t === "dot") {
      this.float(e.uid, `-${e.amount}`, e.t === "damage" && e.crit ? "#ff5252" : "#ff8a80");
      this.shake(e.uid);
    } else if (e.t === "heal" || e.t === "regen") {
      if (e.amount > 0) this.float(e.uid, `+${e.amount}`, "#69f0ae");
    } else if (e.t === "ko") {
      this.float(e.uid, "KO", "#ffffff");
    } else if (e.t === "mod") {
      this.float(e.uid, e.kind === "buff" ? "▲" : e.kind === "debuff" ? "▼" : e.kind, "#c4b5fd");
    }
  }

  private float(uid: string, text: string, color: string) {
    const view = this.views.get(uid);
    if (!view) return;
    const t = this.add
      .text(view.container.x + Phaser.Math.Between(-18, 18), view.container.y - 70, text, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color,
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  private shake(uid: string) {
    const view = this.views.get(uid);
    if (!view) return;
    const x0 = view.container.x;
    this.tweens.add({ targets: view.container, x: x0 + 6, duration: 45, yoyo: true, repeat: 2, onComplete: () => (view.container.x = x0) });
  }
}
