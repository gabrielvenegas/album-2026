# Repository Guidelines

## Project Structure & Module Organization

This is a Vite, React, TypeScript PWA for managing a 2026 World Cup sticker album. Application code lives in `src/`. Route-level screens are in `src/pages/`, shared UI is in `src/components/`, app state is in `src/store/`, static album metadata is in `src/data/`, and utilities are in `src/lib/`. Entry points are `src/main.tsx` and `src/App.tsx`. Global Tailwind styles live in `src/index.css`. Static assets belong in `public/`; PWA configuration is in `vite.config.ts`.

Use the `@/` alias for imports from `src`, for example `import { BottomNav } from '@/components/BottomNav'`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run build`: run TypeScript project checks with `tsc -b` and create a production build with Vite.
- `npm run preview`: serve the production build locally for final inspection.

There is currently no lint or test script configured. Before submitting changes, run `npm run build` at minimum.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Component and page files use PascalCase, such as `CountryCard.tsx` and `CountryDetail.tsx`. Hooks and Zustand stores use camelCase with a `use` prefix, such as `useCollection.ts`. Keep utility modules focused and named by responsibility.

Follow the existing style: 2-space indentation, single quotes, no semicolons, and Tailwind utility classes. Prefer `lucide-react` icons when adding controls. Keep mobile PWA constraints in mind, including safe-area handling and fixed full-screen layout behavior.

## Testing Guidelines

No automated test framework is currently present. If adding tests, prefer a Vite-compatible setup such as Vitest with React Testing Library. Place tests near the code they cover using `*.test.ts` or `*.test.tsx`, and add an `npm test` script in `package.json`. For state changes in `src/store/`, cover persistence, duplicate tracking, and collection progress calculations.

## Commit & Pull Request Guidelines

Recent history uses short `wip` commits, so there is no strict project convention yet. Use concise, imperative commit subjects going forward, for example `Add scanner error state` or `Fix duplicate count export`.

Pull requests should include a short summary, testing notes, and screenshots or screen recordings for visible UI changes. Mention any PWA behavior affected by the change, especially routing, offline assets, safe-area layout, or installability.

## Agent-Specific Instructions

Keep edits scoped to the requested change and do not rewrite unrelated UI or data structures. Preserve Portuguese user-facing copy unless the task explicitly asks for localization changes.
