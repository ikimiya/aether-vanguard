/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base + HashRouter lets the build work under any GitHub Pages
// subpath (https://user.github.io/<repo>/) without hardcoding the repo name.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
