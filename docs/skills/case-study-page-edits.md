# Case Study Page Edits

## When To Use It

Use this when editing a `/:profileSlug/project/:id` experience, including the hero scene, summary grid, content sections, sticky sidebar, or next-project flow.

## Files Usually Involved

- [`src/pages/ProjectDetail.tsx`](../../src/pages/ProjectDetail.tsx)
- [`src/data/portfolioData.ts`](../../src/data/portfolioData.ts)
- [`src/components/3d/ProjectScenes.tsx`](../../src/components/3d/ProjectScenes.tsx)

## Constraints And Pitfalls

- The active case-study theme and hero scene are tied to `profileSlug`, while `project.type` still matters for shared project tone elsewhere in the app.
- The next-project CTA is tied to the active profile's project array order, not an explicit relationship field.
- The detail page no longer uses fake source/demo buttons; keep CTAs truthful unless you add real per-project URLs in data.
- The route redirects to the active profile homepage when `id` lookup fails.

## Safe Workflow

1. Decide whether the change is content-only or page-structure.
2. If content-only, start in `portfolioData.ts`.
3. If page-structure, preserve the existing section hierarchy unless the task needs a clear behavioral change.
4. Keep the hero cinematic, but avoid burying key information inside the 3D layer.
5. If adding new project metadata, wire it through data and rendering together.

## Verification Checklist

- `npm run lint`
- `npm run build`
- Open the edited project detail page directly by `/:profileSlug/project/:id`
- Use the back link
- Use the next-project CTA
- Confirm the selected profile theme and scene match the active profile route and the page remains readable at laptop widths

## Repo-Specific Gotchas

- `flow` rendering depends on splitting the string with `" -> "`.
- The support rail is intentionally non-sticky until very wide screens; if it becomes sticky too early, overlap risk comes back.
- Missing IDs, duplicate IDs within a profile, or incorrect profile-scoped ordering break next-project navigation assumptions.
