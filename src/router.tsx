import { lazy, Suspense } from "react";
import { createHashRouter } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { Home } from "./screens/Home";

// Phaser is ~1.4 MB, so the battle route is split out of the main bundle and
// only fetched when the player enters a battle.
const BattleSandbox = lazy(() =>
  import("./screens/BattleSandbox").then((m) => ({ default: m.BattleSandbox })),
);

// HashRouter: GitHub Pages serves a single index.html, so client-side deep
// links (`/gacha`, `/battle`) must live after the `#` to avoid 404s.
export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "battle",
        element: (
          <Suspense fallback={<p>Loading battle…</p>}>
            <BattleSandbox />
          </Suspense>
        ),
      },
    ],
  },
]);
