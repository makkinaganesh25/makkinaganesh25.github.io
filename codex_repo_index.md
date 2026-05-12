# Codex Repo Index

Read this file with `AGENTS.md` and [`code_repo_update.md`](code_repo_update.md) before making changes.

## Quick Repo Map

- Rolling repo update index: `code_repo_update.md`
- App shell and shared nav/footer: `src/components/Layout.tsx`
- Homepage route and scroll contract: `src/pages/Home.tsx`
- Homepage 3D layer: `src/components/3d`
- Shared homepage content blocks: `src/components/HomeSections.tsx`
- Content source of truth: profile-keyed `portfolioProfiles` in `src/data/portfolioData.ts`
- Repo-specific playbooks: `docs/skills`

## Default Working Rules

- Stay on `main` unless the user explicitly asks for a different branch.
- Make the smallest safe diff.
- Do not redesign unrelated parts of the site while fixing a localized issue.
- If a change alters contributor-facing repo behavior or structure, update `code_repo_update.md` and the affected docs in the same task.
- Run `npm run lint`, `npm run test`, and `npm run build` after edits.

## Homepage Architecture

- `/:profileSlug` is a fixed `Canvas` scene with Drei `ScrollControls` and a `<Scroll html>` content layer.
- `/` redirects to the default profile homepage at `/dataengineer`.
- The homepage is not a normal DOM page. Scroll depth depends on the measured height of the top-level homepage scroll sections in `src/pages/Home.tsx`.
- Top-level homepage sections are tracked with `data-home-scroll-section`. Do not remove or rename those markers without updating the scroll contract.

## Non-Negotiable Homepage Invariants

1. `#contact` and the footer must remain the last two top-level homepage scroll sections in `src/pages/Home.tsx`.
2. All top-level homepage sections must keep the `data-home-scroll-section` markers used by `pages` measurement and invariant checks.
3. Hash links for `#projects`, `#experience`, `#education`, and `#contact` must continue to work.
4. The outer homepage HTML scroll container stays `pointer-events-none`, and interactive descendants stay inside `pointer-events-auto` wrappers.
5. The footer stays under the homepage scroll stack for each `/:profileSlug` home route; do not move it into shared layout for the home route.

## Homepage Repair Workflow

1. Read `AGENTS.md`, this file, and the relevant page/3D playbooks.
2. Start in `src/pages/Home.tsx` for section visibility, ordering, or scroll-depth issues.
3. Change inner spacing before changing section structure.
4. If homepage section order or height changes, re-check the `pages` measurement and the bottom-of-page section order.
5. Touch `StoryScene.tsx` only if the DOM fix leaves the scroll pacing visually out of sync.

## Pre-Handoff Checks

- `npm run lint`
- `npm run test`
- `npm run build`
- `code_repo_update.md` and linked docs reflect any repo-facing contract changes from the task
- Manual homepage smoke pass:
  - hero to contact scroll works on each affected `/:profileSlug` homepage
  - footer is visible directly below contact
  - navbar hashes for `#projects`, `#experience`, `#education`, and `#contact` land correctly inside the active profile route
  - hero CTAs are clickable
  - the homepage works on desktop and a short laptop-height viewport
- If docs changed, do a contradiction pass across `AGENTS.md`, this file, and the edited docs

## Reusable Codex Prompt

```text
Read AGENTS.md, codex_repo_index.md, and code_repo_update.md first. Work on main unless explicitly told otherwise. This homepage is a ScrollControls + Scroll html app, not a normal DOM page.

Treat these as non-negotiable invariants:
1. #contact and footer must remain the last two top-level homepage scroll sections in Home.tsx.
2. All top-level homepage sections must keep the dedicated scroll-section markers used by pages measurement.
3. Hash links for #projects, #experience, #education, and #contact must keep working.
4. The outer Scroll html container stays pointer-events-none and interactive section wrappers stay pointer-events-auto.

Make the smallest safe diff. Do not redesign unrelated sections. After any homepage edit, run npm run lint and npm run build, then manually verify:
- hero to contact scroll works
- footer is visible directly below contact
- navbar/contact hashes land correctly
- hero CTAs remain clickable
- the homepage still works on desktop and a short laptop-height viewport

Do not hand off until those checks pass, or clearly state what could not be verified.
```
