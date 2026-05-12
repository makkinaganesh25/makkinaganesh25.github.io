# Data AGENTS

Scope: everything in `src/data`.

## Local Rules

- `portfolioData.ts` is the single source of truth for profile-specific homepage content, education, project case studies, experience, and shared personal links.
- Keep this file plain data. No JSX, hooks, rendering helpers, or cross-file imports.
- Keep `project.id` values stable and URL-safe within each profile.
- Keep each profile `projects` array order intentional because it controls homepage ordering and the next-project link on detail pages.
- Keep the case-study support fields in sync for every project:
  - `stakes`
  - `ownership`
  - `decisions`
  - `impactMetrics`
- `Project.type` must stay aligned with the supported UI values:
  - `AI`
  - `DE`
  - `DS`
- Adding a new project type requires coordinated updates in:
  - `src/pages/ProjectDetail.tsx`
  - `src/components/HomeSections.tsx`
  - `src/components/3d/ProjectScenes.tsx`
- `education` is rendered on the homepage. Adding or removing entries changes visible homepage content and overall scroll height.
- `certifications` are stored but not currently displayed anywhere.
- `public/profile.jpg` is the profile image used on the homepage. Data changes alone do not replace that asset.
- `personal.resume` currently points every profile to `public/resume.pdf`.
- Legacy role-specific resume filenames are still present in `public/` for compatibility, but new profile links should prefer `public/resume.pdf` unless the user supplies distinct resumes.

## Required Checks After Data Edits

- `npm run lint`
- `npm run build`
- Manual homepage review
- Manual review of each edited project detail page
