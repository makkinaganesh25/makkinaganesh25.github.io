# Homepage Layout Fixes

## When To Use It

Use this when changing homepage spacing, section rhythm, card density, section ordering, or hero/contact sizing without intentionally redesigning the product.

## Files Usually Involved

- [`src/pages/Home.tsx`](../../src/pages/Home.tsx)
- [`src/components/HomeSections.tsx`](../../src/components/HomeSections.tsx)
- [`src/components/Layout.tsx`](../../src/components/Layout.tsx)
- [`src/index.css`](../../src/index.css)
- Sometimes [`src/components/3d/StoryScene.tsx`](../../src/components/3d/StoryScene.tsx) if pacing drifts badly

## Constraints And Pitfalls

- Homepage sections are not ordinary DOM sections. They are rendered inside Drei's scroll HTML layer.
- The top-level homepage sections in `Home.tsx` are tracked with `data-home-scroll-section`. Do not remove those markers or change the final `contact -> footer` order casually.
- Large vertical spacing changes alter `containerRef.scrollHeight`, which changes `ScrollControls.pages`.
- `StoryScene` uses hard-coded depth beats, so dramatic layout changes can make the 3D pacing feel early or late.
- Missing `pointer-events-auto` on a section makes content look correct but behave like a dead overlay.

## Safe Workflow

1. Start in `Home.tsx` and identify whether the issue is inner spacing, section spacing, or page structure.
2. Prefer inner-card padding and local `gap-*` changes before touching section `py-*`.
3. Preserve existing section IDs and overall section order unless the task explicitly needs structural change.
4. Keep `#contact` and the footer as separate final top-level homepage scroll sections.
5. Re-check the scroll feel before deciding that `StoryScene` also needs edits.
6. Touch `StoryScene` only when the DOM fix clearly leaves the camera pacing out of sync.

## Verification Checklist

- `npm run lint`
- `npm run build`
- Scroll from hero to contact on desktop width
- Confirm contact is present and the footer appears immediately below it
- Verify `#projects`, `#experience`, `#education`, and `#contact` hash navigation still lands correctly
- Verify the hero still reads as a full-screen intro
- Verify the projects and experience sections do not feel disconnected from the 3D depth
- Verify buttons and links are still clickable

## Repo-Specific Gotchas

- The hero and contact sections carry the most risk because they contribute large height anchors at the start and end of the narrative.
- The footer can disappear from the homepage if future edits break the top-level scroll-section contract in `Home.tsx`.
- `ProjectTree` density changes can substantially change total page height even if you did not touch `Home.tsx`.
