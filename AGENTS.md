# AGENTS.md

## Repo Overview

- Stack: React 19, Vite 6, TypeScript, Tailwind CSS v4, React Router 7, Framer Motion, React Three Fiber, Drei, and `@react-three/postprocessing`.
- Routes:
  - `/` redirects to the default profile homepage `/dataengineer`.
  - `/:profileSlug` renders the immersive homepage in [`src/pages/Home.tsx`](src/pages/Home.tsx).
  - `/:profileSlug/project/:id` renders case-study detail pages in [`src/pages/ProjectDetail.tsx`](src/pages/ProjectDetail.tsx).
  - `/project/:id` is a legacy redirect to `/dataengineer/project/:id` when that project exists.
- Content source of truth: the profile-keyed `portfolioProfiles` map in [`src/data/portfolioData.ts`](src/data/portfolioData.ts).
- 3D layer: [`src/components/3d`](src/components/3d).
- Shared UI layer: [`src/components`](src/components).

## Start Here

- Read this file first.
- Then read [`codex_repo_index.md`](codex_repo_index.md) for Codex-facing repo invariants and the default branch policy.
- Then read [`code_repo_update.md`](code_repo_update.md) for the rolling repo-update index and contributor-facing change history.
- Then open only the most relevant local instructions:
  - 3D or homepage scroll work: [`src/components/3d/AGENTS.md`](src/components/3d/AGENTS.md)
  - Route or page edits: [`src/pages/AGENTS.md`](src/pages/AGENTS.md)
  - Portfolio content/data updates: [`src/data/AGENTS.md`](src/data/AGENTS.md)
- Repo-local reusable playbooks live under [`docs/skills`](docs/skills). Treat them as the project-specific equivalent of local skills.

## Run The App

- Install: `npm install`
- Dev server: `npm run dev`
- Portfolio regression tests: `npm run test`
- Typecheck: `npm run lint`
- Production build: `npm run build`
- Preview build: `npm run preview`

`npm run lint` is TypeScript-only today. `npm run test` validates portfolio content and layout contracts, including Shiftelix/Rutgers consolidation, visible previous-site links, education/location proof, and compact footer rules. There is no automated browser test suite in this repo yet.

## Verification Flow

- Always run `npm run lint`.
- Always run `npm run test`.
- Always run `npm run build`.
- If a task changes repo-facing architecture, routes, shared contracts, debugging guidance, or workflow expectations, update [`code_repo_update.md`](code_repo_update.md) and any linked docs in the same task.
- Stay on `main` unless the user explicitly asks for a different branch.
- If you touched homepage layout, 3D scenes, or routing, also do a manual smoke pass in the browser:
  - Each affected `/:profileSlug` home route loads more than the navbar.
  - Scroll from hero to contact without sections clipping.
  - Contact is followed immediately by the footer at the bottom of the homepage.
  - Hash navigation works for `#projects`, `#experience`, `#education`, and `#contact` inside the active profile route.
  - Project detail routes load and the back link returns to the correct profile homepage.
- If you touched `portfolioData`, verify every affected section on both routes.

## Architecture Notes

- The homepage is not a normal DOM page. It is a fixed full-screen `Canvas` with `ScrollControls`, while the actual text/content sections live inside `<Scroll html>`.
- The homepage top-level sections are tracked in `src/pages/Home.tsx` via `data-home-scroll-section`. Keep `#contact` and the footer as the final two marked sections.
- `ScrollControls.pages` is derived from measured HTML height in [`src/pages/Home.tsx`](src/pages/Home.tsx). Large spacing or content changes can break the scroll depth if that measurement falls out of sync.
- `StoryScene` uses hard-coded Z positions for narrative beats. Large section order or height changes can desync the 3D motion from the HTML content.
- `ProjectDetail` is profile-scoped. Route lookup stays keyed by `profileSlug`, while the detail-page visual theme and 3D hero scene now follow the active profile family rather than only `project.type`.

## Editing Constraints

- Preserve the current product direction: dark, cinematic, high-contrast, glassy panels, strong typography, and immersive 3D depth.
- Do not redesign the app while doing infra or content work.
- Prefer the smallest safe diff.
- Prefer targeted fixes over refactors.
- Do not add dependencies unless the task clearly requires them.
- Keep content in `portfolioData` instead of scattering copy across components.
- Keep profile-specific copy in `portfolioProfiles` instead of scattering role variants across components.
- Keep 3D scenes decorative and supportive. Do not move critical content into WebGL-only rendering.

## Safe Boundaries By Change Type

### Homepage, 3D, and ScrollControls

- Start in [`docs/skills/3d-scroll-debugging.md`](docs/skills/3d-scroll-debugging.md) or [`docs/skills/homepage-layout-fixes.md`](docs/skills/homepage-layout-fixes.md).
- Do not split the homepage into multiple canvases or remove `ScrollControls` unless the task explicitly requires an architectural refactor.
- Keep `pointer-events-none` on the outer HTML scroll container unless you are deliberately reworking interaction. Restore `pointer-events-auto` on interactive descendants.
- If section order, height, or count changes materially, review:
  - `pages` calculation in [`src/pages/Home.tsx`](src/pages/Home.tsx)
  - Z positions and pacing in [`src/components/3d/StoryScene.tsx`](src/components/3d/StoryScene.tsx)
- Keep `useFrame` work lean. Avoid per-frame object creation and heavy postprocessing additions.

### Spacing and Layout Fixes

- Prefer changing padding, gaps, and max-widths inside existing sections before changing the section stack itself.
- On the homepage, fix spacing from the inside out:
  - inner card padding
  - local section gaps
  - section `py` values
  - section `min-height`
- Avoid changing hero or contact min-heights unless you also verify scroll pacing.
- When a spacing change affects perceived 3D timing, adjust the layout first and touch `StoryScene` only if the desync is still obvious.

### Content and Portfolio Data

- Start in [`docs/skills/content-and-portfolio-data-updates.md`](docs/skills/content-and-portfolio-data-updates.md).
- Keep `project.id` stable. It drives routing.
- Keep `project.id` stable and URL-safe within each profile. The same underlying project may appear in multiple profiles, but each profile array still owns its own route set and ordering.
- Keep each profile `projects` array order intentional. It drives both homepage ordering and the "Next Case Study" CTA.
- `Project.type` is currently limited to `AI`, `DE`, and `DS`. New values require UI and 3D support in multiple files.
- `certifications` currently are stored but not rendered.
- `personal.resume` is profile-specific and is used by navbar, footer, and homepage resume actions. Prefer a real URL over `#`.

## Preferred Debugging Approach

- Start with the layer that owns the bug.
  - Broken copy or missing case-study data: `src/data/portfolioData.ts`
  - Homepage spacing or section visibility: `src/pages/Home.tsx`
  - 3D pacing or WebGL issues: `src/components/3d/*`
  - Shared nav/footer behavior: `src/components/Layout.tsx`
- Use targeted searches with `rg`.
- Read only the files on the change path.
- Avoid broad cleanup while fixing a local issue.

## Docs Map

- Rolling repo update index: [`code_repo_update.md`](code_repo_update.md)
- Architecture overview: [`docs/architecture.md`](docs/architecture.md)
- Frontend system and design constraints: [`docs/frontend-system.md`](docs/frontend-system.md)
- Content/data model: [`docs/content-model.md`](docs/content-model.md)
- Debugging runbook: [`docs/debugging-runbook.md`](docs/debugging-runbook.md)
- Final pre-handoff checklist: [`docs/change-checklist.md`](docs/change-checklist.md)
