# Release Verification

## When To Use It

Use this before handing off a change, opening a PR, or merging any update that touches visible UI, content, routing, or repo scaffolding.

## Files Usually Involved

- The files you changed
- [`code_repo_update.md`](../../code_repo_update.md) if the repo contract or contributor guidance changed
- [`README.md`](../../README.md) if contributor-facing behavior changed
- [`AGENTS.md`](../../AGENTS.md) or docs if workflow guidance changed

## Constraints And Pitfalls

- `npm run lint` is typecheck only.
- `npm run build` catches bundling issues but not visual regressions.
- The homepage can pass build but still feel broken if scroll pacing, pointer events, or route hashes regress.

## Safe Workflow

1. Run `npm run lint`.
2. Run `npm run build`.
3. Manually review the affected routes.
4. If the task changed repo-facing behavior or structure, update `code_repo_update.md`.
5. If docs changed, do a contradiction pass across `code_repo_update.md`, README, AGENTS, and the edited docs.
6. Summarize any residual risk instead of implying certainty.

## Verification Checklist

- `npm run lint`
- `npm run build`
- `code_repo_update.md` reflects any repo-facing contract changes from the task
- Affected `/:profileSlug` home routes load and scroll correctly
- Edited `/:profileSlug/project/:id` routes load correctly
- Navbar links and back links behave correctly
- No doc contradictions in touched contributor files

## Repo-Specific Gotchas

- Content order in each profile's `portfolioData.projects` array is a behavioral detail, not just content.
- A docs-only change can still be harmful if it tells future contributors to treat the homepage like a normal DOM page.
