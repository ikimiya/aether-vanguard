import type { Stage } from "../../types";
import { CHAPTER_1 } from "./chapter-1";

export { ENDLESS } from "./endless";

export const STAGES: Stage[] = [...CHAPTER_1];

export const STAGES_BY_ID: Record<string, Stage> = Object.fromEntries(
  STAGES.map((s) => [s.id, s]),
);

export function getStage(id: string): Stage {
  const s = STAGES_BY_ID[id];
  if (!s) throw new Error(`Unknown stage: ${id}`);
  return s;
}

/** Stage ids in play order. The next stage unlocks when the previous is cleared. */
export const STAGE_ORDER: string[] = STAGES.map((s) => s.id);

export function nextStageId(id: string): string | null {
  const i = STAGE_ORDER.indexOf(id);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}

export function isStageUnlocked(id: string, clearedIds: Set<string>): boolean {
  const i = STAGE_ORDER.indexOf(id);
  if (i <= 0) return true;
  return clearedIds.has(STAGE_ORDER[i - 1]);
}
