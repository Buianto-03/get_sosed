# Repository Guidelines

## Project Structure & Module Organization

This repository has independent client and server npm packages. The React, TypeScript, and Vite client is in `client/`; its `src/` follows Feature-Sliced Design layers: `app`, `pages`, `widgets`, `features`, `entities`, and `shared`. Keep imports flowing down those layers; `npm run check:architecture` enforces boundaries. The Express and Sequelize server is in `server/`; routes/controllers/middleware are under `src/`, and database models, migrations, and seeders under `db/`.

Consult `client/ARCH.md` when making client architecture decisions. Update it when a change alters the documented principles or boundaries.

## Build, Test, and Development Commands

- `cd client && npm run dev` starts Vite for development (API requests expect the server on port 3000).
- `cd client && npm run build` type-checks and builds the client into `server/dist`.
- `cd client && npm run lint` runs ESLint and checks FSD import boundaries; `npm run lint:ts` runs TypeScript checks alone.
- `cd client && npm test` runs the Vitest suite once.
- `cd server && npm run dev` starts the API server with nodemon. Configure PostgreSQL and environment variables before using the database; `npm run db` drops and recreates the development database, then migrates and seeds it.

## Coding Style & Naming Conventions

Format with two spaces, single quotes, semicolons, and trailing commas. Root and `client/.prettierrc` settings plus ESLint enforce style. Use PascalCase for components, camelCase for functions and variables, and kebab-case feature/page directories. Declare React component props with `interface`. Move component-specific helper functions to a sibling `helper.ts` file at the same directory level as the component. Name CSS/SCSS classes with BEM: `block__element_modifier` (for example, `.listing_card__title_featured`). Keep logic in its FSD slice.

In `client/src`, place each React component with its SCSS Module in its own kebab-case directory within the FSD slice. Keep component-specific tests and helpers beside the component; keep shared code at the slice level only when it belongs to the whole slice.

In `client/src`, use relative imports for files within the same FSD slice or component directory. For imports across slices or layers, use the configured `@app`, `@pages`, `@widgets`, `@features`, `@entities`, and `@shared` aliases while respecting FSD boundaries.

## Testing Guidelines

Add client tests beside the behavior, named `*.test.ts` or `*.test.tsx`; Vitest and Testing Library are configured. Run `npm test`, `npm run lint`, and `npm run build` in `client/` for client changes. The server has no test suite (`npm test` is a placeholder); verify changes with focused API/database checks.

## Commit & Pull Request Guidelines

Recent commits use a short `type: summary` format, for example `fix: refresh session` or `redesign: listing gallery`. Keep summaries specific and concise. PRs should explain changes, list checks, link related work, include UI screenshots, and note database or environment changes.

## Configuration & Secrets

Keep credentials and local environment files out of version control. Use `server/.env.exmaple` as the available environment-variable reference and configure database and token secrets locally.
