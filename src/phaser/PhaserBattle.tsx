import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { BattleConfig, BattleState } from "../game/engine";
import { BattleScene } from "./scenes/BattleScene";

const W = 900;
const H = 506;

/** Renders the battlefield for `state`. All input UI is React, layered over this. */
export function PhaserBattle({ config, state }: { config: BattleConfig; state: BattleState }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current!,
      width: W,
      height: H,
      backgroundColor: "#0b0d14",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    game.registry.set("config", config);
    game.registry.set("state", state);
    game.scene.add("battle", BattleScene, true);
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // config/state intentionally read once here; updates flow through the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    // create() reads this if the scene hasn't started yet
    game.registry.set("state", state);
    const scene = game.scene.getScene("battle") as BattleScene | undefined;
    if (scene && scene.scene.settings.status === Phaser.Scenes.RUNNING) {
      scene.syncState(state);
    }
  }, [state]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        maxWidth: W,
        aspectRatio: `${W} / ${H}`,
        margin: "0 auto",
        borderRadius: 12,
        overflow: "hidden",
      }}
    />
  );
}
