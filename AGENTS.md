# Repository Guidelines

## Project Structure & Module Organization

This repository has two independent npm packages; there is no root workspace. The React, TypeScript, and Vite client is in `client/`. Its `src/` follows Feature-Sliced Design: `app`, `pages`, `widgets`, `features`, `entities`, and `shared`. Keep imports flowing down those layers; `npm run check:architecture` enforces boundaries. The Express and Sequelize server is in `server/`, with routes/controllers/middleware under `src/` and database models, migrations, and seeders under `db/`. Static images are in `server/public/`; `docs/` contains project plans.

Consult `client/ARCH.md` when making client architecture decisions. Update it when a change alters the documented principles or boundaries.

## Build, Test, and Development Commands

- `cd client && npm run dev` starts Vite for development (API requests expect the server on port 3000).
- `cd client && npm run build` type-checks and builds the client into `server/dist`.
- `cd client && npm run lint` runs ESLint and checks FSD import boundaries; `npm run lint:ts` runs TypeScript checks alone.
- `cd client && npm test` runs the Vitest suite once.
- `cd server && npm run dev` starts the API server with nodemon. Configure PostgreSQL and environment variables before using the database; `npm run db` drops and recreates the development database, then migrates and seeds it.

## Coding Style & Naming Conventions

Use two spaces, single quotes, semicolons, and trailing commas. Prettier settings are in the root and `client/.prettierrc`; ESLint enforces TypeScript and React rules. Use PascalCase for components, camelCase for functions and variables, and kebab-case feature/page directories. Declare React component props with `interface`. Name CSS/SCSS classes with BEM: `block__element_modifier` (for example, `.listing-card__title_featured`). Keep logic in its FSD slice and use typed API/data models.

## Testing Guidelines

Add client tests beside the behavior, named `*.test.ts` or `*.test.tsx`; Vitest and Testing Library are configured. Run `npm test`, `npm run lint`, and `npm run build` in `client/` for client changes. The server has no test suite (`npm test` is a placeholder); verify changes with focused API/database checks.

## Commit & Pull Request Guidelines

Recent commits use a short `type: summary` format, for example `fix: refresh session` or `redesign: listing gallery`. Keep summaries specific and concise. PRs should explain changes, list checks, link related work, include UI screenshots, and note database or environment changes.

## Configuration & Secrets

Keep credentials and local environment files out of version control. Use `server/.env.exmaple` as the available environment-variable reference and configure database and token secrets locally.
