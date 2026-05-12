# Architecture

## Runtime Map

- Entry point: [`src/main.tsx`](../src/main.tsx)
- Router shell and global providers: [`src/App.tsx`](../src/App.tsx)
- Home/detail scroll snapshot helpers: [`src/utils/homeScrollState.ts`](../src/utils/homeScrollState.ts)
- Shared layout/nav/footer: [`src/components/Layout.tsx`](../src/components/Layout.tsx)
- Homepage route: [`src/pages/Home.tsx`](../src/pages/Home.tsx)
- Project detail route: [`src/pages/ProjectDetail.tsx`](../src/pages/ProjectDetail.tsx)
- Data model: [`src/data/portfolioData.ts`](../src/data/portfolioData.ts)
- Homepage lower-scene data and section ranges: [`src/data/homeSceneData.ts`](../src/data/homeSceneData.ts)
- Global styling: [`src/index.css`](../src/index.css)
- Vite config: [`vite.config.ts`](../vite.config.ts)

## Route Structure

- `/`
  - Redirects to the default profile homepage at `/dataengineer`.
- `/:profileSlug`
  - Reads `profileSlug` from the route.
  - Loads the matching profile from `portfolioProfiles`.
  - Uses a fixed full-screen `Canvas` when WebGL setup succeeds.
  - Falls back to a DOM-only homepage when WebGL capability detection fails or the canvas throws at runtime.
  - Uses `ScrollControls` and `<Scroll html>` to combine WebGL depth with DOM content in canvas mode.
- `/:profileSlug/project/:id`
  - Reads `profileSlug` and `id` from the route.
  - Looks up the matching project only inside the active profile's `projects` array.
  - Chooses one of four role-family detail scenes from `ProjectScenes.tsx` based on the active profile.
- `/project/:id`
  - Redirects legacy project URLs to `/dataengineer/project/:id` when the project exists in the default profile.

## GitHub Pages Artifact Shape

- `npm run build:pages` builds the normal Vite bundle, then generates static route entry points inside `dist/` for:
  - each profile homepage
  - each `/:profileSlug/project/:id` route
  - each legacy `/project/:id` route supported by the default profile
- `dist/404.html` still exists as a fallback, but direct GitHub Pages hits should resolve through those generated route directories first.

## Homepage Architecture

The homepage is the most fragile part of the repo because it mixes three systems at once:

1. A fixed full-screen WebGL scene.
2. DOM sections rendered inside Drei's `<Scroll html>`.
3. Motion transitions and browser hash navigation layered on top.

### Rendering Layers

- `App` also owns the route-shell transition veil. Home/detail route changes animate through one fixed overlay rather than each page independently fading itself.
- `Layout` renders the navbar and route wrapper using the active profile's shared copy and links.
- `Layout` is restore-aware on detail routes: the logo plus `Home` and `Projects` links can return to the last valid scroll snapshot on the active profile homepage.
- `Home` gates canvas rendering through `canCreateWebGLContext` plus `CanvasErrorBoundary`.
- `ScrollViewportBridge` captures Drei's scroll viewport so the page can drive hash navigation, measurement, and motion viewport roots from the same element.
- `SceneLights` and `StoryScene` render the homepage 3D environment.
- `StoryScene` combines `HeroScene` with `HomeLowerScene`.
- `HomeScrollContent` renders the actual content sections inside `<Scroll html>` in canvas mode and directly in DOM fallback mode.
- `Home` also owns the exact home-return contract. Before entering a case study it stores the active profile's current scroll position in session storage, and on a valid return it restores either the hidden canvas viewport or DOM fallback scroll position before normal hero-reset logic runs.
- Top-level homepage sections are tracked with `data-home-scroll-section` markers. They are the source of truth for both `pages` measurement and section-range measurement.
- The current homepage section stack for each `/:profileSlug` route is `hero -> about -> skills -> projects -> experience -> education -> contact -> footer`.
- `homeSceneData.ts` owns the lower-scene geometry, responsive density tuning, and default measured section ranges used by `HomeLowerScene`.

### Why It Is Fragile

- `pages` is derived from measured top-level section offsets/heights plus the scroll viewport height. Breaking the section markers or changing top-level structure can desync the 3D scroll depth from the HTML.
- `sectionRanges` for `projects`, `experience`, and `contact` are measured from live DOM positions and drive `HomeLowerScene`. If those sections move or resize significantly, the lower-scene pacing changes too.
- Hero alignment depends on the DOM portrait measurement in `Home.tsx` feeding `heroAnchor`, which `StoryScene` and `HeroScene` use to place the orbit system behind the portrait.
- `StoryScene` still keeps the hero anchored near `0` and blends the later beats from measured section ranges, so large DOM shifts can still require scene tuning.
- Interactivity depends on the outer scroll container using `pointer-events-none`, with inner sections opting back into `pointer-events-auto`.
- The homepage has two valid render paths now: canvas mode and DOM fallback mode. A change can break one without obviously breaking the other.

## Project Detail Architecture

- `ProjectDetail` is a conventional DOM page with a hero `Canvas` at the top and standard sections below it.
- The active project still comes from the current profile's `projects` array, but the detail-page hero scene and primary visual theme are now selected from the active `profileSlug`.
- `ProjectDetail` reads the internal case-study entry state so the visible "Back to Projects" control only uses history-based exact restore when the current visit truly started from the homepage project list.
- The detail-page body is a mixed DOM layout:
  - narrative sections for problem, stakes, context, architecture, implementation, decisions, and results
  - a supplemental support rail for goals, stack, and constraints
  - responsive workflow cards that replace the old single-row flow strip
- The next-project CTA is computed from the current index in the active profile's `projects` array.

### Consequences

- Project order is user-visible, not just data order.
- Adding a new project type is a cross-cutting change.
- Adding a new profile slug is also a case-study visual change because the detail theme and hero scene are profile-family concepts now.
- The page no longer shows placeholder source/demo buttons; truthful resume/contact CTAs are used instead unless project URLs are added to data later.

## Data Flow

- All display content comes from the `portfolioProfiles` map exported by `portfolioData.ts`.
- `Home.tsx`, `Layout.tsx`, `HomeSections.tsx`, and `ProjectDetail.tsx` all resolve the active profile and read from that map.
- Route-state and session-state helpers in `homeScrollState.ts` connect those pages for exact home-return behavior without changing public URLs.
- Each active profile's `education` array is a visible homepage section, not just stored background data.
- Shared nav, footer, resume links, and hash routes stay scoped to the active `profileSlug`.
- `homeSceneData.ts` drives the lower homepage scene geometry and tuning separately from copy/content.
- There is no backend request path in the current UI.
- AI Studio remnants still exist:
  - `metadata.json`
  - `.env.example`
  - `vite.config.ts` injects `process.env.GEMINI_API_KEY`
  - `@google/genai`, `express`, and `dotenv` are present in `package.json`
- Those pieces are not part of the visible portfolio flow today.

## Major Modules

- [`src/components/HomeSections.tsx`](../src/components/HomeSections.tsx)
  - `SkillsGrid`
  - `ProjectTree`
  - `ExperienceTimeline`
  - `EducationGrid`
- [`src/components/3d/Common.tsx`](../src/components/3d/Common.tsx)
  - shared particles and lighting
- [`src/components/3d/HeroScene.tsx`](../src/components/3d/HeroScene.tsx)
  - hero scene primitives and animation
- [`src/components/3d/HomeLowerScene.tsx`](../src/components/3d/HomeLowerScene.tsx)
  - measured lower-scene visuals for projects, experience, and contact
- [`src/components/3d/ProjectScenes.tsx`](../src/components/3d/ProjectScenes.tsx)
  - Data Engineer / Software Engineer / Data Scientist / Data Analyst detail scenes

## Known Architectural Constraints

- The homepage scroll system is intentionally a single-canvas composition. See [`docs/decisions/001-homepage-scroll-controls.md`](decisions/001-homepage-scroll-controls.md).
- Tailwind is configured through Tailwind v4's CSS-first setup in `src/index.css`, not a repo `tailwind.config.*` file.
- `npm run lint` is typecheck-only, so visual and interaction regressions still require manual verification.
- If a change modifies the repo contract for future contributors, keep [`code_repo_update.md`](../code_repo_update.md) in sync.
