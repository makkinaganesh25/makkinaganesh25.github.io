# Contributing

## Goal

Keep changes fast, targeted, and safe without losing the repo's current dark 3D portfolio direction.

## Before You Edit

- Read [`AGENTS.md`](AGENTS.md).
- Open the scoped `AGENTS.md` for the area you are touching.
- Use the matching playbook in [`docs/skills`](docs/skills).

## Workflow

1. Identify the owning layer before editing:
   - `src/data` for content
   - `src/pages` for route composition and spacing
   - `src/components/3d` for scene work
   - `src/components` for shared UI
2. Prefer the smallest safe diff.
3. Preserve the current design language and structure unless the task explicitly requires change.
4. Avoid new dependencies and broad refactors.
5. Verify with `npm run lint` and `npm run build`.

## Manual Review Expectations

If your change affects visible UI, also check:

- affected `/:profileSlug` homepage load
- affected `/:profileSlug` homepage scroll
- profile-scoped hash navigation
- affected `/:profileSlug/project/:id` pages
- back/next navigation flows

## Docs To Keep In Sync

- [`README.md`](README.md)
- [`AGENTS.md`](AGENTS.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/change-checklist.md`](docs/change-checklist.md)

## Current Reality

- This repo has CI for typecheck and build only.
- Visual regressions are still manual.
- The homepage scroll system is the most fragile area. Use the repo playbooks instead of treating it like a standard landing page.
