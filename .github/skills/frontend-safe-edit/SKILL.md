---
name: frontend-safe-edit
description: 'Safely implement frontend changes in MergeCanvas. Use for UI/UX updates, App.tsx refactors, style edits, i18n text changes, and interaction logic changes with regression checks for desktop/mobile, i18n parity, lint, and build.'
argument-hint: 'Describe the target change and affected area, e.g. "tune crop handle UX in App.tsx"'
user-invocable: true
---

# Frontend Safe Edit

Use this skill to make frontend edits in MergeCanvas with low regression risk.

## When to Use
- Editing UI, interaction, or state logic in src/App.tsx.
- Changing styles in src/App.css or src/index.css.
- Adding or modifying i18n labels (EN/ZH).
- Updating export behavior, canvas rendering, drag/drop, mouse/touch handlers.

## Inputs
- Requested change goal.
- Affected files or feature area.
- Whether behavior must stay backward-compatible.

## Procedure
1. Scope and impact map.
- Identify impacted surfaces: rendering, interaction, i18n, export pipeline, and deployment assumptions.
- Read the smallest set of files needed (typically src/App.tsx, src/App.css, src/index.css, README.md, AGENTS.md).

2. Select a change path.
- If only visual style changes: edit CSS first and keep logic untouched.
- If interaction/event logic changes: validate both mouse and touch paths.
- If text changes: update both EN and ZH keys together.
- If export/deploy behavior changes: verify base path assumptions for GitHub Pages and Docker.

3. Implement minimal edits.
- Prefer small, targeted patches.
- Preserve existing TypeScript strictness and avoid any.
- Do not introduce backend/upload dependencies.

4. Run validation.
- Run npm run lint.
- Run npm run build.
- If behavior changed in drag/crop/canvas paths, also do a quick manual sanity pass in dev mode.

5. Regression checklist before finish.
- Desktop path still works (mouse, wheel, drag/drop reorder where relevant).
- Mobile/touch path still works for touched interactions.
- EN/ZH copy parity is maintained.
- No base-path regressions introduced.
- No unrelated refactors slipped in.

6. Report outcome.
- Summarize changed files and why.
- List checks executed and their results.
- Call out residual risks and suggested follow-up tests if needed.

## Decision Points
- i18n branch:
  - If any user-visible text changed, update both languages in the i18n object.
- Interaction branch:
  - If a handler uses mouse events, verify whether touch handlers need equivalent updates.
- Export branch:
  - If canvas sizing/export logic changed, test with at least one larger image set.
- Deployment branch:
  - If routing/base changed, cross-check vite.config.ts and Docker build base behavior.

## Completion Criteria
- Requested behavior is implemented.
- Lint and build pass.
- Relevant desktop and touch interactions are verified.
- i18n parity is preserved for changed labels.
- Final summary includes risks, if any.

## Repository References
- src/App.tsx
- src/App.css
- src/index.css
- AGENTS.md
- README.md
- vite.config.ts
- Dockerfile
