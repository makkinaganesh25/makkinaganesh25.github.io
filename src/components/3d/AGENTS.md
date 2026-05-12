# 3D Components AGENTS

Scope: everything in `src/components/3d`.

## What Lives Here

- `StoryScene.tsx`: homepage scroll-driven 3D narrative.
- `HeroScene.tsx`: hero scene primitives and motion.
- `ProjectScenes.tsx`: role-family case-study detail scenes keyed from the active profile.
- `Common.tsx`: shared particles and lighting.

## Local Rules

- Keep scenes presentational. Content and copy stay outside this directory.
- Preserve the current visual language: dark space, cinematic glow, and clear per-profile detail-page identities that still feel part of the same product.
- Treat `StoryScene` positions as coupled to homepage section pacing. If you change scene depth or sequence, verify the HTML sections still feel aligned while scrolling.
- Keep `useFrame` callbacks cheap. No per-frame allocations, large arrays, or new expensive effects unless absolutely necessary.
- Reuse existing Drei primitives and shared lighting before adding new geometry or packages.
- Do not make scene changes that only work for one route if the component is shared across a profile family.

## Required Checks After 3D Edits

- `npm run lint`
- `npm run build`
- Manual homepage scroll pass
- Manual project detail route pass for each affected profile family

## First References

- [`docs/skills/3d-scroll-debugging.md`](../../../docs/skills/3d-scroll-debugging.md)
- [`docs/architecture.md`](../../../docs/architecture.md)
