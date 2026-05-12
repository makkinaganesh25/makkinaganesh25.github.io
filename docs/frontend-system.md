# Frontend System

## Design Language To Preserve

- Overall tone: premium, dark, cinematic engineering portfolio.
- Base palette: black backgrounds, white text, gray body copy, emerald highlights.
- Secondary tones:
  - AI projects: blue
  - Data engineering projects: amber
  - Data science projects: purple
- Surfaces: glassy or translucent cards with subtle borders, blur, and restrained glow.
- Motion: present, but supportive. The UI should feel alive without becoming noisy or unreadable.

## Styling System

- Tailwind CSS v4 is imported in [`src/index.css`](../src/index.css).
- Global font theme is set there.
- Google Fonts are loaded in [`index.html`](../index.html).
- Shared class composition helpers live in `Layout.tsx` and `HomeSections.tsx` via `clsx` + `tailwind-merge`.

## Layout Rules

- Homepage sections live inside the scroll HTML layer in [`src/pages/Home.tsx`](../src/pages/Home.tsx).
- Shared width conventions:
  - major containers often use `max-w-7xl`
  - hero content uses `max-w-5xl`
  - contact CTA narrows to `max-w-4xl`
- Section spacing is primarily controlled by:
  - `px-6`
  - `py-*`
  - inner card padding
  - `gap-*`

## Safe Spacing Strategy

When a section feels too loose or too cramped, change spacing in this order:

1. Inner card padding and section-local gaps.
2. Inner wrapper max-width or text width.
3. Section `py` values.
4. Hero/contact min-heights only if the first three are insufficient.

Why this order matters:

- Inner spacing changes preserve scroll pacing better.
- Large `py` changes alter overall page height and can desync `ScrollControls`.
- Hero/contact min-height changes are most likely to distort the narrative pacing of the 3D scene.

## 3D + DOM Boundary

- DOM owns readability, copy, and CTA interaction.
- 3D owns ambience, narrative pacing, and visual identity.
- If a layout task can be solved in DOM, solve it there first.
- Only touch `StoryScene` when the visual rhythm is clearly broken after DOM fixes.

## Motion Rules

- Reuse existing `motion` patterns:
  - fade/slide-in on section blocks
  - light hover lift on cards
  - simple route fade transitions
- Avoid adding many competing animation styles in one section.
- Keep hover behavior subtle and consistent with the current premium tone.

## Common UI Fragility

- The homepage outer HTML container is `pointer-events-none`.
- Buttons, cards, and links only work because section wrappers restore `pointer-events-auto`.
- Removing that opt-in is a common cause of "UI looks fine but nothing clicks."

## Practical Edit Boundaries

- Changing the active profile entry in `portfolioData` should usually be enough for copy, metrics, skills, experience, and case-study text.
- Changing card appearance usually belongs in `HomeSections.tsx`.
- Changing page-level spacing usually belongs in `Home.tsx` or `ProjectDetail.tsx`.
- Changing scene geometry or scroll beat pacing belongs in `src/components/3d/*`.
