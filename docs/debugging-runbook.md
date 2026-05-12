# Debugging Runbook

## Baseline Commands

- `npm run dev`
- `npm run lint`
- `npm run build`

Start with the smallest relevant command. Use the browser for anything visual.

## Failure Mode: Navbar Loads But Page Content Does Not

This repo can fail in a specific way where the fixed navbar renders, but the homepage body looks blank or incomplete. That usually means the route shell mounted but the homepage `Canvas` or scroll HTML layer failed.

Check in this order:

1. Open the browser console and look for runtime errors from:
   - `Home.tsx`
   - `StoryScene.tsx`
   - `HeroScene.tsx`
   - `ProjectScenes.tsx`
2. Confirm [`src/pages/Home.tsx`](../src/pages/Home.tsx) still renders:
   - the fixed black wrapper
   - canvas mode when enabled
   - DOM fallback mode when canvas is disabled
   - `ScrollControls`
   - `<Scroll html>`
3. Confirm the active profile entry in `portfolioData.ts` still has all fields referenced by the homepage.
4. If the navbar appears over a plain black background with no hero DOM content, inspect the `CanvasErrorBoundary`, `canCreateWebGLContext`, and `HomeScrollContent` path together.
5. If the hero DOM content appears but the 3D layer does not, suspect a canvas-only error or a disabled WebGL path rather than missing route content.
6. If some content appears but the scroll is too short, suspect `pages` measurement or a zero-height `containerRef`.

## Failure Mode: Scroll Depth Feels Wrong Or Sections Clip

Symptoms:

- The camera reaches the end too early.
- HTML sections overlap strangely.
- The contact section arrives before the 3D story settles.

Check:

1. Did a section gain or lose a lot of height in `Home.tsx`?
2. Do all top-level homepage sections still have the expected `data-home-scroll-section` markers?
3. Does the measured bottom edge of the top-level sections still roughly match the actual page height?
4. Do the measured `sectionRanges` for `projects`, `experience`, and `contact` still line up with the intended lower-scene pacing?
5. Did a late-loading asset change the height after the initial `pages` calculation?

Fix strategy:

- Adjust DOM spacing first.
- Re-test.
- Only adjust `StoryScene` Z positions if the DOM fix leaves the 3D pacing visibly off.

## Failure Mode: Homepage Opens Mid-Page Instead Of The Hero

Likely cause: the hidden Drei `ScrollControls` viewport kept or inherited a non-top scroll position.

Check:

1. [`src/pages/Home.tsx`](../src/pages/Home.tsx) still initializes the canvas scroll viewport once on a no-hash home entry instead of resetting it from multiple places.
2. The inner viewport still resets to Drei's expected top offset (`scrollTop = 1`) rather than `0`.
3. Direct hash entry such as `/dataengineer#projects` or `/dataengineer#education` still skips the hero reset and scrolls to the target section.
4. [`src/index.css`](../src/index.css) does not apply `scroll-behavior: smooth` to every element, which can affect the hidden scroll container created by `ScrollControls`.
5. The `<ScrollControls>` style in `Home.tsx` still forces `scrollBehavior: "auto"` on the hidden viewport.

## Failure Mode: Returning From A Case Study Lands At The Top Of Home

Likely cause: the restore handshake between `Home`, `ProjectDetail`, `Layout`, `ScrollToTop`, and `homeScrollState.ts` broke.

Check:

1. `src/pages/Home.tsx` still saves a `HomeScrollSnapshot` before navigating from a homepage project card into a case study.
2. `src/utils/homeScrollState.ts` still reads and writes the per-profile snapshot and pending-restore keys from `sessionStorage`.
3. `src/components/ScrollToTop.tsx` still skips the global top reset when a valid explicit home-restore state exists or when a `POP` navigation finds a pending restore for that profile.
4. `src/pages/Home.tsx` still detects explicit restore state or pending `POP` restore state before running its normal hero-reset effects.
5. `src/pages/ProjectDetail.tsx` still uses `navigate(-1)` only when the detail route was actually entered from the homepage, and falls back to `/:profileSlug#projects` for direct-open detail pages.
6. `src/components/Layout.tsx` should only use snapshot-aware `Home` / `Projects` destinations on detail routes, not on the homepage itself.

## Failure Mode: Hero Background No Longer Centers On The Portrait

Likely cause: the DOM-to-scene anchor path drifted.

Check:

1. `heroPortraitRef` in [`src/pages/Home.tsx`](../src/pages/Home.tsx) still targets the portrait wrapper and not a differently sized parent.
2. The hero portrait dimensions or surrounding layout did not change in a way that makes the measured center misleading.
3. `heroAnchorX` and `heroAnchorY` are still being updated from the scroll viewport measurements.
4. [`src/components/3d/HeroScene.tsx`](../src/components/3d/HeroScene.tsx) still uses the measured world anchor directly instead of adding a hard-coded vertical bias.
5. `StoryScene.tsx` camera positioning still treats the hero as the locked intro state at the top of the page.

## Failure Mode: Buttons Or Links Stop Working On The Homepage

Likely cause: `pointer-events` layering.

Check:

1. The outer scroll HTML container should remain `pointer-events-none`.
2. Interactive section wrappers should remain `pointer-events-auto`.
3. Any new button, card, or link added inside the scroll layer must still sit inside a clickable wrapper.

## Failure Mode: Hash Navigation Does Not Reach The Expected Section

Likely causes:

- the pending hash request was allowed to settle before the hidden Drei `ScrollControls` viewport existed or could reach the final target
- native browser hash-anchor behavior fought the app-owned canvas scroll logic on same-page navbar clicks

Check:

1. The target section `id` and matching section nav anchor still exist in `Home.tsx`.
2. Navbar links still point to the right hash.
3. `ScrollViewportBridge` is still capturing the correct scroll viewport element in canvas mode before pending hash requests are cleared.
4. In canvas mode, `Home.tsx` should own hash scrolling against the hidden `ScrollControls` viewport. Same-page navbar clicks should not rely on browser-native anchor scrolling.
5. `ScrollToTop.tsx` still performs the global top reset for normal route changes, but skips it for valid restoreable home returns. The home page itself still owns hash scrolling.
6. The route still lands on the expected `/:profileSlug` homepage before the hash-based scroll runs.
7. The active route should be `/:profileSlug#section`, not an unscoped hash like `/#projects`.
8. The section target should align below the fixed navbar, not at the padded outer section wrapper.

## Failure Mode: GitHub Pages Direct Routes Return 404

Likely cause: the published `dist/` artifact is missing static route entry points for profile or project paths.

Check:

1. `npm run build:pages` still runs `scripts/build-pages.ts` after `vite build`.
2. The built `dist/` directory contains:
   - `dataengineer/index.html`
   - `softwareengineer/index.html`
   - at least one profile project path such as `dataengineer/project/shiftelix-workforce-os/index.html`
   - at least one legacy path such as `project/enterprise-data-lake-modernization/index.html`
3. `dist/404.html` still exists as the fallback entry.
4. `.github/workflows/deploy.yml` still deploys `dist/` from `main`.

## Failure Mode: Project Detail Shows The Wrong Scene Or Accent

Check:

1. The active `profileSlug` resolution in `ProjectDetail.tsx`
2. Theme / scene mapping in `ProjectDetail.tsx`
3. `project.type` and `icon` in `portfolioData.ts` if the homepage card tone is wrong
4. Scene implementation in `ProjectScenes.tsx`
5. The project lookup is happening inside the expected profile's `projects` array rather than another profile.

## Failure Mode: Build Or Typecheck Breaks After Content Edits

Likely causes:

- missing required fields in a profile entry inside `portfolioData`
- changing `flow` to a non-string structure
- missing `stakes`, `ownership`, `decisions`, or `impactMetrics` on a project after expanding the case-study layout
- introducing a new `type` value without updating unions
- introducing a new profile slug or profile map entry without updating route handling

Use `npm run lint` first. It is the fastest repo-native guardrail.

## Practical Debugging Heuristic

- If the issue is visual but not 3D-specific, start in DOM files.
- If the issue follows a route param, profile slug, or project type, start in `portfolioData`.
- If the issue appears only while scrolling, inspect `Home.tsx` and `StoryScene.tsx` together.
