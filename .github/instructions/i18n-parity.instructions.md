---
description: "Use when adding or changing user-visible text in MergeCanvas frontend. Enforce EN/ZH key parity, naming consistency, and no hardcoded UI copy outside the i18n object."
name: "MergeCanvas i18n parity"
applyTo: "src/**/*.{ts,tsx}"
---

# MergeCanvas i18n parity

Current language dictionaries are maintained in src/App.tsx.

- Keep English and Chinese dictionaries with identical key sets.
- Add new keys in both languages within the same change.
- If a key is renamed or removed, update both language dictionaries and all usages in the same change.
- Avoid hardcoded user-visible strings in JSX; use i18n lookups such as T.someKey.
- Keep placeholder variable names consistent across languages when template text is used.
- Preserve existing tone and terminology consistency for both EN and ZH text.

## Completion checks
1. Verify every newly added or edited key exists in both language dictionaries.
2. Verify no new hardcoded UI copy was introduced in edited TS or TSX UI code.
3. If code changed, run lint and build checks before finishing.
