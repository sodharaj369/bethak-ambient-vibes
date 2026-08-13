# BETHAK

> A quiet place on the internet.

![BETHAK — the room](docs/images/bethak-preview.png)

**Live demo:** [bethak-ambient-vibes.lovable.app](https://bethak-ambient-vibes.lovable.app)

The production experience lives at `/`. Everything else in this repository is supporting code or a
documented development prototype — do not treat other routes as the demo.

## What is BETHAK?

BETHAK (बैठक) is an immersive listening experience inspired by the feeling of sitting in a
traditional Indian bethak — a late-night sitting room with ghazals playing softly, chai on the
table and the fan turning overhead. It combines curated ghazal sessions, cinematic room scenes,
ambient sound layers and a few small interactive discoveries.

It is not a streaming service, not a game and not an app with a dashboard. It is one room.

## Experience

You enter the room with a single tap. The scene starts, the ghazal rises, the ambience settles
underneath it. You pick a mood, dim the light, sip the chai, and stay a while.

> Not something to scroll. Somewhere to sit.

| Desktop | Mobile |
| --- | --- |
| ![Desktop](docs/images/bethak-preview.png) | ![Mobile](docs/images/bethak-mobile.png) |

## Features

- **Ghazal listening** — curated, mood-based sessions rather than an endless catalogue.
- **Ambient sound** — an independent ambient layer per mood, with crossfades and its own volume.
- **Cinematic rooms** — four scenes: **Raat**, **Baarish**, **Shaam**, **Yaadein**.
- **Mobile room exploration** — on portrait mobile you can pan sideways across the wider scene;
  the pan is clamped geometrically so the video edges are never exposed.
- **Room lighting** — Auto / Warm / Dim / Candle overlays rendered inside the room frame, so they
  pan with the scene.
- **Chai Ki Chuski** — a discoverable interaction on the chai: a ceramic clink and a quiet thought.
- **Harmonium** — a second hidden interaction, which opens once the chai has been found.
- **Shareable moods** — mood deep links, e.g. `/?mood=baarish`.
- **Session persistence** — remembers mood, track, position and preferences without ever violating
  browser audio rules.
- **Audio lifecycle** — nothing plays before you enter the room, and everything stops when the tab
  goes to the background, with no autoplay on return.

### Accessibility

- All interactive controls have accessible names, including the Chai and Harmonium hotspots, the
  Candle/light control, the Ambience toggle and volume, and Share.
- Toggles expose `aria-pressed`; the player and mood row are labelled groups.
- Controls are real `<button>` elements, so keyboard activation works; hotspots are removed from
  the tab order while the room is not yet entered.
- Focus is shown with `:focus-visible` outlines rather than always-on rings — no visible debug or
  accessibility chrome is added to the room.
- `prefers-reduced-motion: reduce` is respected across the scene crossfades, ambient animations,
  hotspot hints and the entrance reveal.

## Tech Stack

- React 19 + TypeScript
- TanStack Start / TanStack Router (file-based routing, SSR)
- Vite
- Tailwind CSS v4 with a hand-written atmospheric stylesheet (`src/styles.css`)
- YouTube IFrame Player API — the actual music playback engine
- HTML5 `<video>` for the room scenes, HTML5 `<audio>` for ambience and interaction sounds
- `localStorage` / `sessionStorage` for session and preference persistence

No backend, no database, no API keys.

## Architecture

```text
Visitor
  ↓ enters the room (single user gesture unlocks all audio)
Room / Scene  ──  Lighting layer  ──  Interaction hotspots
  ↓
Music engine   Ambience engine
  ↓
Persistence (localStorage)
```

- **Music engine** — `src/services/musicEngine.ts`: playback through the YouTube IFrame API,
  session/playlist state, shuffle and repeat, position tracking, and a cached snapshot consumed by
  the player via `useSyncExternalStore`.
- **Ambience engine** — `src/services/ambienceEngine.ts`: one ambience track per mood, crossfaded
  on mood change, with independent volume and persistence.
- **Room / scene** — `src/components/BethakBackground.tsx`, `src/data/scenes.ts`,
  `src/hooks/useRoomPan.ts`: dual looping video layers, per-mood responsive focal points, and the
  clamped mobile portrait pan.
- **Interaction hotspots** — `src/components/ChaiSpot.tsx`, `src/components/HarmoniumSpot.tsx`,
  with their own one-shot sounds.
- **Lighting** — `src/components/RoomLight.tsx`, `src/lib/roomLight.ts`.
- **Persistence** — `src/lib/bethakSession.ts`: mood, current track, playback position (24h TTL)
  and preferences.

## Project Structure

```text
src/
  components/   room, player, controls, hotspots (ui/ holds unused shadcn primitives)
  routes/       index.tsx (the room), bethak.tsx (mood redirect), pan-lab.tsx (prototype)
  services/     music, ambience, chai and harmonium audio engines
  data/         playlist, mood scenes, curated sessions, chai lines
  hooks/        useRoomPan — mobile pan geometry
  lib/          session + lighting persistence helpers
  styles.css    the whole visual system
public/
  scenes/       mood videos and their poster frames
  ambience/     ambient and interaction audio
docs/
  images/       README and social preview assets
  GITHUB_SETUP.md  repository metadata a maintainer must apply manually
```

### Editing the playlist

`src/data/bethakPlaylist.ts` is the single editable list: `{ id, title, artist, youtubeId }`.
Artwork is derived automatically from the YouTube thumbnail — never hardcode it.

### `/pan-lab` — development prototype

`src/routes/pan-lab.tsx` is an experimental development prototype, kept as a documented example of
how the mobile pan geometry was tuned. It is `noindex`, its debug readout only renders in dev
builds, and it does not affect the production route `/`.

## Getting Started

No Node version is pinned in `package.json`; the project is developed on Node 20+. npm is the
documented package manager, and Bun works too (the GitHub Pages workflow uses Bun).

```bash
git clone <repository-url>
cd <repository-name>
npm install
npm run dev
```

The dev server prints a local URL.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint (also runs Prettier as a lint rule) |
| `npm run format` | Prettier write |

There is **no `test` script** and no automated test suite in this repository.

## Environment Variables

BETHAK needs **no environment variables** to run locally or in production, and there is no
`.env.example` because nothing is configurable through env. Two variables are read only inside
`vite.config.ts` and are set automatically by GitHub Actions when deploying to GitHub Pages:

| Variable | Set by | Purpose |
| --- | --- | --- |
| `GITHUB_PAGES` | CI workflow | Switches the Vite `base` to the repository subpath |
| `GITHUB_REPOSITORY` | GitHub Actions | Supplies the repository name for that base path |

## Browser Audio Behavior

- Nothing plays until you tap **बैठक में आइए** — a single user gesture unlocks the ghazal, the
  ambience and the interaction sounds together.
- When the tab is hidden, music, ambience and one-shot sounds are stopped. Returning to the tab
  never autoplays; you resume deliberately.
- Playback position is restored from the last session (24h TTL), but paused.
- Room videos are muted, looped and `playsinline`, so they satisfy mobile autoplay policies.

## Testing

There is no automated test suite. All verification for V4 was manual, performed against the dev
and production builds; a headless browser (Playwright, run ad hoc from the development
environment — it is **not** a project dependency and no test files are committed) was used during
development to reproduce and confirm fixes for the mobile pan geometry and a React update-depth
issue.

Manually verified during V4:

- **Desktop** — Chromium-based desktop browser at ~1280–1440px wide.
- **Mobile viewport** — emulated portrait viewports around 390×844, including the room pan.
- **Music playback** — play/pause, next/previous, seek, shuffle, repeat modes, auto-advance at
  track end and on player errors, playlist drawer open/close.
- **Audio lifecycle** — no audio before the entry gesture; all audio stops on tab hide; no autoplay
  on return.
- **Ambience** — toggle, volume, and crossfade when the mood changes.
- **Mood switching** — scene crossfade, curated session swap, ambience swap.
- **Session restoration** — mood, track and position restored on reload, always paused.
- **Mobile pan** — clamped horizontal drag with no exposed video edges; hotspots and lighting pan
  with the scene; vertical scroll is not hijacked.
- **Chai** — one-tap clink, occasional line, discovery hint shown once per visit.
- **Harmonium** — unlocked after the chai, single note per tap, first-time line.
- **Candle/light** — Auto / Warm / Dim / Candle cycling and persistence.
- **Share URLs** — `?mood=<id>` deep links open the correct mood; share/copy fallback works.
- **Background/foreground** — repeated hide/show cycles leave no audio running and no stuck state.

Browser compatibility beyond the above has **not** been verified. Safari, Firefox and older mobile
browsers are untested.

## Known Limitations

- **Browser audio restrictions** — audio can only start from a user gesture, so the room always
  requires the entry tap. Some browsers additionally cap or delay media playback in background or
  low-power modes.
- **In-app browsers** — Instagram, Facebook and similar webviews often restrict autoplay, the
  YouTube IFrame API and the Web Share/clipboard APIs; playback or sharing may fail there.
- **YouTube dependency** — playback is delegated to the YouTube IFrame Player API. If a video is
  removed, region-blocked or embedding-disabled, that track is skipped.
- **Media assets** — the scene videos are relatively large and are not adaptive; on slow
  connections the poster frame is shown for longer.
- **Mobile crop** — portrait viewports crop the scene; the pan mitigates but does not eliminate
  this, and the framing is tuned per mood rather than dynamically.
- **Discovery behaviour** — the Chai and Harmonium hints are intentionally subtle and are shown
  once per visit, so they can be missed entirely. Discovery state uses `sessionStorage` and is lost
  in private/blocked-storage contexts.
- **Testing coverage** — no automated tests, and no verified support matrix (see Testing).
- **Reduced motion** — motion is reduced, not removed: scenes still play video.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and
[SECURITY.md](SECURITY.md).

## License

No LICENSE file exists in this repository, so the work is "all rights reserved" by default.
**License decision required before public reuse is encouraged.**

BETHAK does not host or distribute music. Playback is delegated to the official YouTube IFrame
Player API, and each track links back to its source on YouTube. Ambient and interaction sounds are
generated for this project. The room illustrations and videos belong to the project author.

## Evolution

- **V1** — initial concept: the room, the title and a single music player.
- **V2** — cinematic room experience: video scenes, moods and the entrance.
- **V3** — ambience, curated mood sessions and the room discoveries (Chai, Harmonium).
- **V4** — mobile room exploration, atmospheric lighting, and a full stability and polish pass.

## Deployment

- **Live demo** — the URL above.
- **GitHub Pages** — `.github/workflows/deploy.yml` builds a static SPA on push to `main`. The
  Vite `base` path is derived from `GITHUB_REPOSITORY`, so nothing is hardcoded.
