# Change Checklist

## Before Editing

- Stay on `main` unless the user explicitly asks for a different branch.
- Identify the owning layer:
  - content/data
  - page layout
  - shared UI
  - 3D scene
- Open the matching `AGENTS.md` and relevant playbook in `docs/skills/`.
- Decide whether the task changes the repo contract enough to require a `code_repo_update.md` entry.
- Confirm whether the task can stay data-only or doc-only before touching components.

## While Editing

- Keep the diff narrow.
- Preserve the dark 3D design language.
- Avoid broad refactors and new dependencies.
- If the task changes repo-facing behavior, structure, debugging guidance, or workflow expectations, update `code_repo_update.md` and the linked docs before handoff.
- If the homepage height changes materially, remember the `ScrollControls` coupling.
- If the project model changes, remember profile-scoped route IDs, type mapping, and project order.

## Before Finishing

- Run `npm run lint`
- Run `npm run build`
- Update `code_repo_update.md` if the repo contract changed
- If the UI changed, manually verify the affected route(s)
- For homepage edits, explicitly verify that `#contact` is present and the footer is directly below it
- For homepage edits, verify `#projects`, `#experience`, `#education`, and `#contact` hash navigation inside each affected profile route
- Check README, AGENTS docs, `code_repo_update.md`, and edited docs for contradictions if you touched any of them

## In The Handoff Summary

- Files changed
- Checks run
- Any docs or index files updated
- Any residual risk
- Any follow-up that should happen in a separate task
