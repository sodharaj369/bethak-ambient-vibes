# Contributing to BETHAK

> BETHAK prioritizes atmosphere, restraint and a quiet user experience.

Please avoid adding UI or interactions unless they clearly improve the experience. Small, careful
changes are preferred over large ones.

## How to contribute

1. **Fork** the repository.
2. **Create a feature branch**: `git checkout -b my-change`
3. **Install dependencies**: `npm install` (Bun works too: `bun install`)
4. **Run locally**: `npm run dev` and open the printed local URL.
5. **Test your change** manually in desktop and mobile-portrait viewports — check music playback,
   ambience, mood switching, the mobile pan, Chai, Harmonium and the light control. Then run:
   ```bash
   npm run lint
   npm run build
   ```
6. **Open a pull request** using the pull request template, describing what changed, why, and how
   you tested it. Include a screenshot or short clip for anything visual.

## Guidelines

- No audio may start without a user gesture, and all audio must stop when the tab is hidden.
- Keep the visual system in `src/styles.css`; respect `prefers-reduced-motion`.
- Add songs by editing `src/data/bethakPlaylist.ts` only — artwork is derived automatically.
