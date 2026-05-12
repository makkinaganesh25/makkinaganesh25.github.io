# Pages AGENTS

Scope: everything in `src/pages`.

## Local Rules

- Keep route-level responsibilities here: page composition, route params, scroll setup, and scene selection.
- Do not move shared layout, nav, or footer logic into page files.
- Keep page copy data-driven. Prefer updates in `portfolioProfiles` over embedding new strings directly in the page unless the text is page-structural.

## Home Page Specifics

- `Home.tsx` owns the fixed `Canvas`, `ScrollControls`, `<Scroll html>`, section order, `pages` measurement, and active `profileSlug` lookup.
- Keep section `id` values stable unless you also update every hash link that targets them.
- For spacing or section order changes, review [`docs/skills/homepage-layout-fixes.md`](../../docs/skills/homepage-layout-fixes.md).

## Project Detail Specifics

- `ProjectDetail.tsx` derives the active project from the current profile's `projects` array in `portfolioProfiles`, while the detail-page hero theme and 3D scene are selected from the active `profileSlug`.
- If you change `Project.type` semantics or ordering, review this page together with `HomeSections.tsx`, `ProjectScenes.tsx`, and `portfolioData.ts`.
- The detail page currently uses truthful cross-site CTAs (`Resume`, `Get In Touch`, next-project navigation) instead of placeholder source/demo buttons.

## Required Checks After Page Edits

- `npm run lint`
- `npm run build`
- Manual route smoke check for any affected `/:profileSlug` and `/:profileSlug/project/:id` routes
