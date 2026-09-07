import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUserId } from "../auth/useSession";
import { currencyRepo, endlessRepo, gachaRepo, progressRepo, rosterRepo } from "../lib/db";
import type { Currencies } from "../lib/db/currency";
import type { OwnedCharacter } from "../lib/db/roster";
import type { StageProgress } from "../lib/db/progress";
import type { GachaState } from "../lib/db/gacha";
import type { EndlessRun } from "../lib/db/endless";

interface GameData {
  currencies: Currencies;
  roster: OwnedCharacter[];
  progress: StageProgress[];
  gachaState: GachaState;
  endless: EndlessRun;
}

interface GameDataContext extends Partial<GameData> {
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  clearedStageIds: Set<string>;
}

const Ctx = createContext<GameDataContext | null>(null);

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  const userId = useUserId();
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const [currencies, roster, progress, gachaState, endless] = await Promise.all([
        currencyRepo.get(userId),
        rosterRepo.list(userId),
        progressRepo.list(userId),
        gachaRepo.get(userId),
        endlessRepo.get(userId),
      ]);
      setData({ currencies, roster, progress, gachaState, endless });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your data");
    }
  }, [userId]);

  useEffect(() => {
    setData(null);
    void reload();
  }, [reload]);

  const loading = data === null && error === null;

  const clearedStageIds = new Set(
    (data?.progress ?? []).filter((p) => p.cleared).map((p) => p.stage_id),
  );

  return (
    <Ctx.Provider value={{ ...data, loading, error, reload, clearedStageIds }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGameData(): GameDataContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGameData must be used within <GameDataProvider>");
  return ctx;
}
