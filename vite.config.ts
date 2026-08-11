// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// --- GitHub Pages build (opt-in, never affects dev or the Lovable deployment) ---
// Enabled only when GITHUB_PAGES=true (set by .github/workflows/deploy.yml).
// Base path is derived from the repository name via GITHUB_REPOSITORY ("owner/repo"),
// so no username or repo name is hard-coded.
const isPages = process.env["GITHUB_PAGES"] === "true";
const repoName = (process.env["GITHUB_REPOSITORY"] ?? "").split("/")[1] ?? "";
const pagesBase = repoName ? `/${repoName}/` : "/";

export default defineConfig({
  ...(isPages ? { vite: { base: pagesBase } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(isPages
      ? {
          // Static output: prerender the routes and ship an SPA fallback.
          prerender: { enabled: true, crawlLinks: true },
          spa: { enabled: true },
        }
      : {}),
  },
  // GitHub Pages is static hosting: skip the Nitro server build entirely.
  ...(isPages ? { nitro: false as const } : {}),
});
