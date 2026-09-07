import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BattleScene } from "./scenes/BattleScene";

const WIDTH = 900;
const HEIGHT = 506;

/**
 * Mounts a Phaser game into a div and tears it down on unmount. Milestone 6
 * extends this with props for the encounter and callbacks for the result.
 */
export function PhaserBattle() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current!,
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: "#12151f",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BattleScene],
    });

    return () => game.destroy(true);
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        maxWidth: WIDTH,
        aspectRatio: `${WIDTH} / ${HEIGHT}`,
        margin: "0 auto",
        borderRadius: 12,
        overflow: "hidden",
      }}
    />
  );
}
