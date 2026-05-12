# 3D Scroll Debugging

## When To Use It

Use this when the homepage scroll narrative, WebGL scenes, camera pacing, or section-to-scene alignment feels broken.

## Files Usually Involved

- [`src/pages/Home.tsx`](../../src/pages/Home.tsx)
- [`src/components/3d/StoryScene.tsx`](../../src/components/3d/StoryScene.tsx)
- [`src/components/3d/HeroScene.tsx`](../../src/components/3d/HeroScene.tsx)
- [`src/components/3d/ProjectScenes.tsx`](../../src/components/3d/ProjectScenes.tsx)
- [`src/components/3d/Common.tsx`](../../src/components/3d/Common.tsx)

## Constraints And Pitfalls

- `ScrollControls.pages` comes from measured HTML height, not a fixed page count.
- `StoryScene` depth positions are hard-coded and assume the current section rhythm.
- Over-fixing the 3D layer can mask a layout problem that should have been solved in DOM first.
- Heavy new scene work can degrade performance quickly in this repo because all homepage 3D runs continuously behind the HTML layer.

## Safe Workflow

1. Confirm whether the bug is really a 3D issue and not just DOM spacing.
2. Validate the `pages` calculation in `Home.tsx`.
3. Inspect scene anchor positions in `StoryScene.tsx`.
4. Keep any `useFrame` changes allocation-free.
5. Prefer small camera or position adjustments over total scene rewrites.

## Verification Checklist

- `npm run lint`
- `npm run build`
- Scroll top to bottom on the homepage
- Confirm the hero scene feels centered at the start
- Confirm the end glow arrives near the contact/footer close
- Open at least one project detail page per affected type

## Repo-Specific Gotchas

- `useIsPresent` in `Home.tsx` gates the scroll scene during route transitions.
- Postprocessing currently consists of Bloom plus Chromatic Aberration. Adding more effects raises risk faster than it seems.
