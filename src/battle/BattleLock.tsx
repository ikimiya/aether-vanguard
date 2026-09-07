import { createContext, useContext, useEffect, useState } from "react";

type LockCtx = { inBattle: boolean; setInBattle: (v: boolean) => void };

const Ctx = createContext<LockCtx>({ inBattle: false, setInBattle: () => {} });

export function BattleLockProvider({ children }: { children: React.ReactNode }) {
  const [inBattle, setInBattle] = useState(false);
  return <Ctx.Provider value={{ inBattle, setInBattle }}>{children}</Ctx.Provider>;
}

/** True while a battle screen is mounted — the app chrome hides its nav then. */
export function useBattleLock(): boolean {
  return useContext(Ctx).inBattle;
}

/** Flags the app as in-battle for as long as the calling component is mounted. */
export function useHoldBattleLock(): void {
  const { setInBattle } = useContext(Ctx);
  useEffect(() => {
    setInBattle(true);
    return () => setInBattle(false);
  }, [setInBattle]);
}
