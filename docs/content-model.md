# Content Model

## Source Of Truth

All user-facing portfolio content lives in the profile-keyed `portfolioProfiles` map in [`src/data/portfolioData.ts`](../src/data/portfolioData.ts).

## Top-Level Shape

- `profileSlugs`
- `defaultProfileSlug`
- `portfolioProfiles`

Each entry in `portfolioProfiles` contains:

- `personal`
- `metrics`
- `skills`
- `projects`
- `experience`
- `education`
- `certifications`
- `sectionCopy`
- `footer`

## `personal`

Used by:

- homepage hero
- about section chips
- contact section
- navbar and footer links

Important fields:

- `name`
- `headline`
- `about`
- `focusAreas`
- `email`
- `linkedin`
- `github`
- `resume`
- `location`

Repo-specific notes:

- The homepage avatar comes from [`public/profile.jpg`](../public/profile.jpg), not from `portfolioData`.
- `resume` is linked in multiple places. Current Ganesh profile variants all point to `/resume.pdf`.
- Legacy role-specific resume filenames remain in `public/` for compatibility, but new profile links should prefer `/resume.pdf` unless distinct resumes are supplied.

## `metrics`

Used by the homepage "About" area for highlight cards. Keep labels short enough to fit in small cards.

## `skills`

Used by `SkillsGrid` on the homepage.

Rules:

- Keep categories short and scannable.
- Keep each skill entry concise. Long strings wrap and quickly make the grid uneven.

## `projects`

Used by:

- homepage project tree
- project detail route lookup
- project detail hero copy, support rail, workflow modules, and result cards
- next-project CTA

Required fields:

- `id`
- `title`
- `type`
- `typeLabel`
- `icon`
- `summary`
- `role`
- `domain`
- `techStack`
- `problem`
- `context`
- `stakes`
- `ownership`
- `goals`
- `architecture`
- `implementation`
- `decisions`
- `flow`
- `challenges`
- `impactMetrics`
- `outcomes`
- `lessons`

Repo-specific rules:

- `id` must stay stable and URL-safe within each profile because it becomes `/:profileSlug/project/:id`.
- `type` must stay one of `AI`, `DE`, or `DS` unless the UI is extended.
- `typeLabel` is the display-facing project category used in the UI. It can say `Software Engineering`, `Data Analytics`, and similar role framing without changing the underlying project-type union.
- `icon` is data-driven and controls the project card icon in `HomeSections.tsx`.
- `flow` is split on `" -> "` in `ProjectDetail.tsx`. Keep that exact delimiter if you want the visual system flow pills to render correctly.
- `stakes`, `ownership`, `decisions`, and `impactMetrics` are all visible on the case-study route. If you add them for one project, keep the structure consistent across the whole profile.
- Each profile's `projects` array order drives:
  - the homepage project sequence
  - the next-project CTA on that profile's detail pages

Current behavior:

- The detail page uses truthful cross-site CTAs (`Resume`, `Get In Touch`, next-project navigation) instead of project-specific source/demo links.
- There is still no project-level URL field in the data model for source code or live demos.

## `experience`

Used by the homepage `ExperienceTimeline`.

Rules:

- Keep bullet copy short enough for card layout.
- Skills should stay tag-friendly and not become sentence fragments.

## `education`

Used by the homepage education section.

Required fields:

- `school`
- `degree`
- `period`
- `location`
- `details`

Rules:

- Keep `details` concise enough to fit inside the existing card layout.
- Fold GPA and coursework into `details` instead of introducing extra rendered fields unless the UI is intentionally expanded.

## `certifications`

Currently stored but not rendered anywhere. Updating this section alone has no visible product effect.

## `sectionCopy`

Used by the homepage for profile-specific section intros and contact framing.

Important fields:

- `about`
- `skills`
- `projects`
- `experience`
- `education`
- `contact`

Repo-specific notes:

- This is where role-specific homepage titles, descriptions, footer-facing contact framing, and profile chips belong.
- Keep section copy concise enough for the existing cinematic layout.

## `footer`

Used by the shared footer tagline. Keep it short enough to avoid wrapping badly on smaller screens.

## When A Content Change Needs Code

- New project type: yes
- New route: yes
- New rendered content section: yes
- Text, metrics, skills, experience, project case-study copy: usually no
- Replacing profile image: asset change in `public/profile.jpg`, not just data
