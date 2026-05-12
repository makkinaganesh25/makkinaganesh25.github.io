# Ganesh Makkina 3D Engineering Portfolio

Premium React + Vite + Three.js portfolio for Ganesh Makkina, with role-specific views across data engineering, software/product engineering, data science, and analytics.

## Quickstart

Prerequisites: Node.js 20+ and npm.

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Open the local URL printed by Vite

Useful commands:

- `npm run dev`: local development server on port `3000`
- `npm run lint`: TypeScript typecheck
- `npm run build`: production build
- `npm run build:pages`: production build for GitHub Pages, including static route entry points, `404.html`, and `.nojekyll`
- `npm run preview`: preview the built app

## GitHub Pages Deployment

This repo is configured for GitHub Pages root user-site hosting at:

- `https://makkinaganesh25.github.io/`

Role-specific entry URLs:

- `https://makkinaganesh25.github.io/dataengineer`
- `https://makkinaganesh25.github.io/softwareengineer`
- `https://makkinaganesh25.github.io/datascientist`
- `https://makkinaganesh25.github.io/datanalyst`

Production builds use the Vite base path `/`, and the app router uses the same runtime base. Public assets such as the profile image and resume resolve from the root user-site URL so the app does not generate duplicated project-site URLs.

The previous static Ganesh portfolio is preserved under `public/archive/previous-site/` as an archive, but it is not linked from the current navigation or footer.

For GitHub Pages builds, use:

1. `npm run lint`
2. `npm run build:pages`

`build:pages` also creates `dist/404.html`, `dist/.nojekyll`, and static `index.html` entry points for every profile homepage plus every profile-scoped and legacy project route. That keeps direct GitHub Pages hits like `/dataengineer` and `/softwareengineer/project/shiftelix-workforce-os` on a `200` path instead of relying only on the SPA `404` fallback. The Pages workflow only deploys when this source is pushed to `makkinaganesh25/makkinaganesh25.github.io`, preventing the project repo from publishing a root-base build under the old project-site path.

## Current Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS v4
- React Router 7
- Framer Motion
- React Three Fiber + Drei + Postprocessing

## Project Structure

- [`src/pages/Home.tsx`](src/pages/Home.tsx): homepage with `Canvas`, `ScrollControls`, and HTML overlay sections
- [`src/pages/ProjectDetail.tsx`](src/pages/ProjectDetail.tsx): profile-scoped project detail route
- [`src/components/3d`](src/components/3d): shared 3D scenes and effects
- [`src/components`](src/components): shared layout and section components
- [`src/data/portfolioData.ts`](src/data/portfolioData.ts): profile-aware source of truth for content

## Route Structure

- `/` redirects to `/dataengineer`
- `/:profileSlug` renders the active profile homepage
- `/:profileSlug/project/:id` renders the active profile's case-study page
- `/project/:id` remains as a legacy redirect to `/dataengineer/project/:id` when that project exists

## How The Homepage Works

Each profile homepage is intentionally not a conventional DOM page.

- A fixed full-screen `Canvas` renders the 3D story.
- Drei `ScrollControls` drive the camera movement.
- The visible text sections are rendered inside `<Scroll html>`.
- Total page height is measured to keep `ScrollControls.pages` aligned with the HTML content.

That coupling is the main source of both the experience quality and the repo's layout fragility. Treat homepage spacing work carefully.

## Contributor Operating Docs

Start here for future work:

- Root repo instructions: [`AGENTS.md`](AGENTS.md)
- Rolling repo update index: [`code_repo_update.md`](code_repo_update.md)
- Contributor workflow: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Frontend system: [`docs/frontend-system.md`](docs/frontend-system.md)
- Content model: [`docs/content-model.md`](docs/content-model.md)
- Debugging runbook: [`docs/debugging-runbook.md`](docs/debugging-runbook.md)
- Change checklist: [`docs/change-checklist.md`](docs/change-checklist.md)

Repo-specific playbooks:

- [`docs/skills/homepage-layout-fixes.md`](docs/skills/homepage-layout-fixes.md)
- [`docs/skills/3d-scroll-debugging.md`](docs/skills/3d-scroll-debugging.md)
- [`docs/skills/content-and-portfolio-data-updates.md`](docs/skills/content-and-portfolio-data-updates.md)
- [`docs/skills/case-study-page-edits.md`](docs/skills/case-study-page-edits.md)
- [`docs/skills/release-verification.md`](docs/skills/release-verification.md)

## Verification Expectations

Minimum for any meaningful change:

- `npm run lint`
- `npm run build`

If the UI changed, also manually verify the affected profile homepages, profile-scoped hash navigation, and any affected project detail pages.

## Notes On Environment And AI Studio Remnants

- `.env.example` still contains AI Studio/Gemini placeholders.
- `vite.config.ts` still injects `process.env.GEMINI_API_KEY`.
- The visible portfolio currently does not call Gemini or an Express backend in the UI path.

Those remnants are safe to leave alone unless a task explicitly reintroduces productized AI features.
