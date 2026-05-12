# Content And Portfolio Data Updates

## When To Use It

Use this for profile copy changes, metrics, skills, experience, project case-study content, link updates, or replacing portfolio identity data without redesigning the UI.

## Files Usually Involved

- [`src/data/portfolioData.ts`](../../src/data/portfolioData.ts)
- [`public/profile.jpg`](../../public/profile.jpg) if the headshot changes
- role-specific resume PDFs under `public/` if the resume assets change
- Occasionally:
  - [`src/pages/Home.tsx`](../../src/pages/Home.tsx)
  - [`src/pages/ProjectDetail.tsx`](../../src/pages/ProjectDetail.tsx)

## Constraints And Pitfalls

- `project.id` changes break route URLs.
- `projects` ordering is user-visible within each profile.
- `Project.type` is not arbitrary; it still drives shared project semantics and homepage tone.
- `flow` must remain a string using `" -> "` separators if you want the case-study flow UI to keep working.
- The case-study route now expects `stakes`, `ownership`, `decisions`, and `impactMetrics` on each project entry.
- `certifications` are currently unused, so editing them alone will not change the UI.

## Safe Workflow

1. Make data-only changes first.
2. Only touch components if the requested content requires a new rendered field.
3. Keep strings concise enough for the existing layout, but do not leave the detail-page support fields sparse.
4. If replacing links, verify every place the link is used, especially `resume`.
5. Keep each profile resume URL aligned with the asset actually shipped in `public/`.

## Verification Checklist

- `npm run lint`
- `npm run build`
- Review homepage hero, about, skills, projects, experience, and contact
- Open every edited project detail page
- Verify next-project navigation still makes sense after any reorder

## Repo-Specific Gotchas

- The detail page uses truthful `Resume` and `Get In Touch` CTAs instead of fake project-link buttons.
- The homepage image fallback points to Unsplash if `public/profile.jpg` fails to load.
- Resume actions across the app are expected to resolve through the active profile's `personal.resume` URL.
