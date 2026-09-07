import { lazy, Suspense } from "react";
import { createHashRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { RequireAuth } from "./auth/RequireAuth";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { Signup } from "./screens/Signup";
import { StageSelect } from "./screens/StageSelect";
import { Roster } from "./screens/Roster";
import { CharacterDetail } from "./screens/CharacterDetail";
import { Gacha } from "./screens/Gacha";
import { Formation } from "./screens/Formation";

// Phaser is ~1.4 MB, so battle routes are split out of the main bundle and
// only fetched when the player enters a fight.
const lazyScreen = (load: () => Promise<{ [k: string]: React.ComponentType }>, name: string) => {
  const C = lazy(() => load().then((m) => ({ default: m[name] })));
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <C />
    </Suspense>
  );
};

// HashRouter: GitHub Pages serves a single index.html, so client-side deep
// links must live after the `#` to avoid 404s.
export const router = createHashRouter([
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/sandbox", element: lazyScreen(() => import("./screens/BattleSandbox"), "BattleSandbox") },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "stages", element: <StageSelect /> },
      { path: "stages/:stageId", element: lazyScreen(() => import("./screens/StageBattle"), "StageBattle") },
      { path: "gacha", element: <Gacha /> },
      { path: "roster", element: <Roster /> },
      { path: "roster/:characterKey", element: <CharacterDetail /> },
      { path: "formation", element: <Formation /> },
      { path: "endless", element: lazyScreen(() => import("./screens/Endless"), "Endless") },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
