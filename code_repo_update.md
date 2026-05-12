# Code Repo Update

This file is the rolling repo-update index for contributor-facing changes. Update it in the same task whenever code or docs change the repo's structure, architecture, workflow, or debugging contract.

## Update Rule

- Update this file when you change routes, top-level file ownership, shared UI contracts, homepage scene contracts, audio behavior, data contracts, verification flow, or contributor docs.
- Keep linked docs in sync in the same task when needed:
  - `AGENTS.md`
  - `codex_repo_index.md`
  - `README.md`
  - `docs/architecture.md`
  - `docs/debugging-runbook.md`
  - `docs/change-checklist.md`
- Keep entries additive and dated. Do not rewrite history unless an older entry is factually wrong.

## Current Snapshot

### 2026-03-29

- App shell:
  - `src/App.tsx` keeps `ScrollToTop` at the app shell level and owns the route-transition shell.
- Homepage:
  - `src/pages/Home.tsx` supports both canvas mode and a DOM-only fallback when WebGL setup or canvas rendering fails.
  - Top-level homepage sections are tracked with `data-home-scroll-section` markers and remain the source of truth for scroll measurement.
  - Hero portrait alignment is measured from the DOM portrait node and passed into the 3D hero scene through `heroAnchor`.
- 3D layer:
  - `src/components/3d/StoryScene.tsx` combines the hero scene with `HomeLowerScene`.
  - `src/data/homeSceneData.ts` owns measured scene ranges, lower-scene geometry, and responsive tuning constants.
- Verification contract:
  - `npm run lint`
  - `npm run build`
  - Manual homepage and affected-route checks for any visual, routing, or 3D changes

## Recent Updates

### 2026-05-12

- Switched the production GitHub Pages target from the project-site path to the root user-site path:
  - `vite.config.ts` now uses production base `/` so generated assets and routes resolve under `https://makkinaganesh25.github.io/`
  - `README.md` now documents the root Pages URLs (`/dataengineer`, `/softwareengineer`, `/datascientist`, `/datanalyst`) and removes the old project-site URL guidance
  - `.github/workflows/deploy.yml` now deploys only from `makkinaganesh25/makkinaganesh25.github.io`, so the project repo cannot publish a root-base artifact under the old `/ganesh-makkina-portfolio/` URL
  - the previous static site remains archived under `public/archive/previous-site/` but is still not exposed as a visible nav/footer item

- Upgraded the homepage lower-scene visual contract from generic space/ship effects into a section-specific data infrastructure journey:
  - `StoryScene` now uses a subtle bounded infrastructure backplane with lower star counts and no global particle burst or floating space object
  - `HeroScene` now uses plain geometry for identity-signal orbits instead of Drei trail/line helpers, avoiding MeshLine console errors and keeping the hero lightweight
  - `HomeLowerScene` now gives projects product orbit nodes and database shards, experience service-grid and observability pulse geometry, education a centered Rutgers academic data core, and contact a calm signal-line field
  - `homeSceneData` now anchors education with Rutgers core offsets and contact with signal-line data while keeping lightweight-mode object counts bounded
  - `scripts/validate-portfolio.ts` locks the new scene contract, including no education spaceship motif, no noisy lower-scene particle bursts, no large green/teal bubble, lite-mode postprocessing safety, bounded star counts, and the contact signal-field gate

- Added the cinematic homepage tile-motion contract:
  - `src/components/HomeMotion.tsx` now owns the shared `ScrollRevealTile` primitive for one-time tile pop-ins, scroll-root-aware parallax, and reduced-motion fallback behavior
  - homepage hero, about, skill, project, experience, education, and contact tile surfaces now use the shared reveal primitive without changing measured section order or footer scroll math
  - card internals stay static and more opaque so text remains crisp, while the tile itself owns the reveal motion
  - Rutgers 3D education motion is now anchored to the Rutgers education card instead of the full education section
  - `StoryScene` and `HomeLowerScene` now use measured section progress to pulse and drift lower-scene chapters in sync with the DOM tile reveals
  - the visible reactive/contact green bubble meshes were removed so contact and education transitions keep the 3D depth without a large teal orb covering the page
  - `scripts/validate-portfolio.ts` checks that the reveal primitive, reduced-motion path, viewport-root support, and 3D chapter pulse hooks stay present

- Added the lightweight homepage performance contract:
  - `src/pages/Home.tsx` now detects a lightweight performance mode for compact viewports, reduced motion, low-memory/low-CPU hints, and Save-Data
  - Canvas DPR, antialiasing, postprocessing, particle counts, pointer-following light, and ScrollControls damping now adapt for smoother up/down scrolling
  - hero anchor measurement is passive scroll/resize-driven instead of running a layout read every animation frame
  - `src/components/HomeMotion.tsx` now keeps reveal animations transform/opacity-only by default and releases `will-change` after tiles reveal
  - `scripts/validate-portfolio.ts` now locks these performance contracts so expensive scroll observers, large particles, and permanent hero DOM measurement do not return accidentally

- Fixed the homepage ScrollControls footer end-state by keeping Drei `pages` tied to visual content travel instead of the native hidden scroll DOM height, so max scroll ends at the compact footer.
- Added rendered homepage scroll geometry coverage:
  - `npm run test` now also runs `scripts/validate-home-scroll-geometry.ts`
  - the rendered check launches local Vite plus headless Chrome, opens software/data engineer `#contact` routes at desktop and mobile widths, verifies the contact hash landing, verifies both desktop "Let's Talk" CTA paths, scrolls to max, and asserts the footer is visible at the viewport bottom with no large blank band after it

### 2026-05-11

- Added a portfolio regression test command to keep future content/layout edits from reintroducing recent issues:
  - `npm run test` runs `scripts/validate-portfolio.ts`
  - `npm run build` and `npm run build:pages` now run the regression test first through npm pre-scripts
  - the test checks Shiftelix/Rutgers consolidation, education/location proof, visible previous-site link removal, archive preservation, and compact footer layout rules
- Corrected the homepage footer layout contract so the footer wrapper stays content-height instead of reserving viewport-height space, and tightened `scripts/validate-portfolio.ts` to reject future fake footer/contact spacer classes.

### 2026-05-11

- Repurposed the portfolio for Ganesh Makkina while preserving the existing React/Vite/Three.js architecture:
  - `src/data/portfolioData.ts` now uses Ganesh's resume, public LinkedIn/Shiftelix evidence, and GitHub profile context across the role-specific profile routes
  - `public/profile.jpg` and `public/resume.pdf` were replaced with Ganesh's supplied headshot and resume
  - the previous static `makkinaganesh25.github.io` site was copied into `public/archive/previous-site/` and linked from the current navbar/footer as "Previous Site"
  - `README.md`, `index.html`, `metadata.json`, and content docs now describe the Ganesh-owned project-site target `https://makkinaganesh25.github.io/ganesh-makkina-portfolio/`

### 2026-05-11

- Prepared the Ganesh portfolio for a new GitHub Pages project repo instead of replacing the existing root user-site repo:
  - `vite.config.ts` now uses production base `/ganesh-makkina-portfolio/`
  - deployment docs now point to `https://makkinaganesh25.github.io/ganesh-makkina-portfolio/`
  - the existing `makkinaganesh25.github.io` repository remains untouched, with the old site separately archived inside this new project build

### 2026-04-04

- Removed the experimental sound system and all repo-level audio contracts:
  - `src/App.tsx` no longer wraps the router in `SoundProvider`, and the route shell keeps only the visual transition layer
  - `src/components/Layout.tsx`, `src/pages/Home.tsx`, `src/pages/ProjectDetail.tsx`, and `src/components/HomeSections.tsx` no longer import or fire sound interactions, cues, prompts, or sound-toggle UI
  - `src/audio/*`, `src/components/SoundPrompt.tsx`, `src/components/SoundToggle.tsx`, `public/audio/*`, and the renderer script were removed from the repo
  - `package.json` no longer depends on `howler`
  - `README.md`, `docs/architecture.md`, and `docs/debugging-runbook.md` no longer document an audio runtime or asset contract

### 2026-04-04

- Added a route-aware premium soundscape and the runtime audio asset contract:
  - `src/audio/soundConfig.ts` now defines distinct home/detail ambient cues, case-study transition cues, `education` as a first-class major home section, and the required `public/audio/*` asset list
  - `src/audio/SoundProvider.tsx` now owns sound prompt dismissal, route-aware soundscape mode (`home` / `detail` / `off`), mobile-safe cue scaling, and the activation-tone opt-in flow
  - `src/audio/soundController.ts` now crossfades between home and detail ambience and ducks the active ambient bed under impact / case-study transition cues
  - `src/App.tsx` now switches soundscape mode centrally by route kind, while `src/components/Layout.tsx` renders the shared `SoundPrompt` alongside the existing navbar sound toggle
  - `src/pages/Home.tsx` and `src/pages/ProjectDetail.tsx` now fire the new section, education, contact, and case-study transition cues without changing routing or layout architecture
  - `docs/architecture.md` and `docs/debugging-runbook.md` now document the new prompt/session-state contract and the exact `public/audio` runtime asset set

### 2026-04-04

- Repaired profile-home hash navigation on the GitHub Pages build:
  - `src/pages/Home.tsx` now keeps canvas hash requests pending until the hidden Drei viewport is ready, then computes section targets from stable homepage-content offsets instead of viewport-rect deltas
  - `src/components/Layout.tsx` now intercepts same-page profile hash clicks so `Home` owns canvas-mode section scrolling and repeated clicks on the active hash can re-run the jump without relying on browser-native anchors
  - `src/pages/Home.tsx` now uses explicit section nav anchors plus a delayed hash-settle flow that waits until the current scroll container can reach the final target before clearing the pending jump
  - `src/components/Layout.tsx` keeps `Education` as a first-class profile hash destination alongside `Projects`, `Experience`, and `Get in Touch`
  - `docs/debugging-runbook.md` now documents viewport-readiness and native-anchor interference as the primary hash-navigation failure modes, and contributor docs continue to treat `#education` as part of the supported homepage hash-link contract

### 2026-04-04

- Tightened case-study return behavior so home restoration waits for the real saved offset instead of restoring as soon as the homepage becomes merely scrollable:
  - `src/pages/Home.tsx` now keeps restore state pending until the canvas or DOM scroll container can actually reach the saved snapshot, then applies the restore and triggers a transient resume highlight for the originating project card
  - `src/components/ScrollToTop.tsx` now defers all top resets whenever a valid home restore is pending, leaving restore completion to `Home`
  - `src/components/HomeSections.tsx` now accepts an optional `restoredProjectId` so the project rail can briefly re-emphasize the resumed case-study card without changing layout density

### 2026-04-04

- Added exact home-scroll restoration for case-study entry and exit across the profile-scoped routes:
  - `src/utils/homeScrollState.ts` now owns the internal session-backed snapshot and restore-state contract used between `Home`, `ProjectDetail`, `Layout`, and `ScrollToTop`
  - `src/pages/Home.tsx` now snapshots the active profile homepage scroll position before project-card navigation, restores the hidden `ScrollControls` viewport on valid returns, and skips hero resets during restoration
  - `src/pages/ProjectDetail.tsx` now distinguishes true home-entry back behavior from direct-open fallback behavior, while the shared navbar logo plus `Home` / `Projects` exits preserve the last valid home snapshot
- Moved primary route-change animation ownership into the app shell:
  - `src/App.tsx` now wraps routed pages in a shared cinematic transition veil keyed by route kind (`home` vs `detail`)
  - `src/pages/Home.tsx` and `src/pages/ProjectDetail.tsx` no longer own full-page fade wrappers, so local reveal motion stays local and route transitions stay coordinated
- Updated debugging and architecture docs to reflect the new restore-aware navigation flow and the app-shell transition layer.

### 2026-04-04

- Rebuilt the profile-scoped case-study route as a richer, role-family detail experience:
  - `src/pages/ProjectDetail.tsx` now uses a premium multi-section layout with a hero metrics rail, support rail, responsive workflow cards, implementation/decision modules, and truthful cross-site CTAs instead of placeholder source/demo buttons
  - the old single-row system-flow strip was replaced with responsive cards so laptop-width layouts no longer collide with the support rail
- Expanded the project data contract in `src/data/portfolioData.ts` for every profile's case studies:
  - each project now includes `stakes`, `ownership`, `decisions`, and `impactMetrics` to support deeper, structured storytelling on the detail route
  - `flow` remains string-based with `" -> "` separators for route-level workflow rendering
- Replaced the old AI / DE / DS detail-scene mapping with role-family case-study hero scenes in `src/components/3d/ProjectScenes.tsx`:
  - Data Engineer, Software Engineer, Data Scientist, and Data Analyst routes now each use their own visual language
  - detail-page scene choice is keyed from the active `profileSlug`, while `project.type` remains part of the shared content model and homepage project tone
- Updated contributor docs to reflect the new case-study contract, profile-family hero-scene mapping, and removal of placeholder project-link buttons.

### 2026-04-04

- Converted the portfolio from a single profile into four role-specific variants served from profile-scoped routes:
  - `/` redirects to `/dataengineer`
  - `/:profileSlug` renders the active profile homepage
  - `/:profileSlug/project/:id` renders the active profile case-study route
  - `/project/:id` remains as a legacy redirect into the default profile when possible
- Replaced the single exported `portfolioData` object with a profile-keyed `portfolioProfiles` map in `src/data/portfolioData.ts`:
  - profile-specific headlines, about copy, focus areas, metrics, skills, experience emphasis, project framing, resume URLs, contact copy, and footer taglines now live in data
  - project display labels and project card icons are now data-driven while 3D scene selection still depends on the existing `AI` / `DE` / `DS` visual types
- Updated shared layout, homepage, and project detail navigation so hash links, resume links, back links, and next-project flows stay inside the active profile route.
- Refreshed contributor docs to describe the new routing and data contract, including profile-specific resume assets and profile-scoped project IDs.
- Updated `build:pages` so GitHub Pages now emits static `index.html` entry points for every profile homepage and every profile-scoped or legacy project path, keeping direct route requests on `200` responses instead of the generic `404.html` fallback.

### 2026-04-04

- Migrated GitHub Pages deployment from the old project-site URL to the root user-site URL `https://tanvisha28.github.io/`:
  - Vite production base path is now `/`
  - the router and shared public-asset helpers continue to resolve from `import.meta.env.BASE_URL`
  - `.github/workflows/deploy.yml` publishes `dist` to GitHub Pages from `main`
  - `npm run build:pages` remains the release build entrypoint and still generates `404.html` and `.nojekyll`
- Updated contributor-facing deployment docs in `README.md` to reflect the new Pages contract for `tanvisha28.github.io`.

### 2026-04-04

- Stabilized homepage scroll initialization in canvas mode:
  - the inner Drei `ScrollControls` viewport now initializes once per no-hash home entry instead of relying on duplicate reset paths
  - the homepage resets the hidden scroll viewport to Drei's expected top offset (`scrollTop = 1`) rather than `0`
  - clearing a home hash back to `/` resets the canvas viewport to the hero without affecting direct hash entry
- Narrowed global smooth-scroll CSS so it no longer applies to every element:
  - the hidden `ScrollControls` viewport is now explicitly `scrollBehavior: auto`
  - global smooth scrolling is limited to the document root, while intentional section jumps still use explicit smooth scrolling

### 2026-03-29

- Added a durable repo-maintenance rule that contributor-facing changes must also update this file and the linked repo docs.
- Refreshed repo docs to reflect the current homepage systems:
  - WebGL capability/error fallback
  - measured homepage section ranges for lower-scene pacing
  - homepage sound system and sound toggle
  - hero portrait-to-scene anchoring
- Corrected the hero orbit-system alignment so the 3D hero background uses the measured portrait center without an extra downward offset.
- Standardized the shared resume asset to `public/resume.pdf` and updated the personal contact/link data in `portfolioData.personal`.
- Switched shared email actions from `mailto:` to Gmail compose URLs so homepage and footer contact links open reliably in-browser.
- Rewrote the portfolio content around the uploaded resume, added a visible homepage education section, and replaced the placeholder case studies with resume-grounded narratives while preserving existing project ids.
- Added GitHub Pages project-site deployment support for `https://makkinaganesh25.github.io/tanvisha/`:
  - Vite production base path is `/tanvisha/`
  - the router uses the Pages base path at runtime
  - shared public assets and audio now resolve through the current base path
  - `npm run build:pages` generates `dist/404.html` and `.nojekyll` for Pages hosting
