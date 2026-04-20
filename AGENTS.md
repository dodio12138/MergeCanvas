# MergeCanvas Agent Guide

This file gives AI coding agents the minimum project-specific context needed to work effectively.

## Scope
- Frontend-only app: React + TypeScript + Vite.
- All image operations are local in the browser (no backend, no uploads).

## First Steps
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run lint before finishing: `npm run lint`
4. Build to verify release output: `npm run build`

## Key Commands
- `npm run dev`: Vite development server.
- `npm run lint`: ESLint checks.
- `npm run build`: TypeScript build (`tsc -b`) + Vite build.
- `npm run preview`: Serve built output locally.
- Docker:
  - `docker build -t mergecanvas .`
  - `docker run -d -p 8080:80 mergecanvas`

## Architecture Map
- Entry: `index.html` -> `src/main.tsx` -> `src/App.tsx`
- Main app logic is centralized in `src/App.tsx` (state, rendering, interactions, i18n).
- Styles: `src/App.css` (feature styles) and `src/index.css` (global styles).
- Static assets: `src/assets/`.

## Project Conventions
- Keep TypeScript strict-compatible (`strict`, `noUnusedLocals`, `noUnusedParameters` enabled).
- Prefer explicit types for app data models and handlers; avoid adding `any`.
- Keep EN/ZH i18n keys in sync when adding new UI text.
- Preserve local-first behavior: do not introduce server-side upload/processing dependencies.

## Deployment-Specific Notes
- `vite.config.ts` uses `base: '/MergeCanvas/'` for GitHub Pages.
- Docker build uses `npx vite build --base=/` in `Dockerfile` for root-served static hosting.
- If deployment target changes, update base-path assumptions in both places.

## Known Pitfalls
- Drag/number interaction logic in `src/App.tsx` uses mouse and touch handlers; test both desktop and mobile paths after UI changes.
- Canvas export behavior can degrade with very large merged dimensions; verify with realistic large input sets.
- `safeRandomUUID` fallback exists for environments without `crypto.randomUUID`; do not remove compatibility path lightly.

## Documentation
- Read `README.md` for product overview, features, and deployment context.
