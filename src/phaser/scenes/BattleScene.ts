import Phaser from "phaser";

/**
 * Placeholder battle scene for Milestone 1. Milestone 6 replaces the body with
 * team layout, HP/MP bars, the action menu, and event-log playback.
 */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super("battle");
  }

  create() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 12, "Battle Scene", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#e7e9f0",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 20, "Phaser is wired up. Combat lands in Milestone 6.", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#9aa0b4",
      })
      .setOrigin(0.5);
  }
}
