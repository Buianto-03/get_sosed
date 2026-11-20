# Repository Guidelines

## Codex Multi-Agent Workflow

Use this workflow for implementation requests. The coordinating agent inspects
the relevant code and presents a plan before any implementation edits. Include
the intended behavior, affected packages, dependencies, and verification steps.
When the user starts in Plan mode, wait until they start implementation and use
the resulting plan. In Default mode, present the plan and proceed when the user
has requested implementation.

After planning, spawn the `architect` subagent with the plan and its success
criteria. The architect owns the client/server contract, breaks the plan into
concrete tasks, and delegates to `frontend` for `client/` and `backend` for
`server/`. Start only the agents needed for the task. Run independent assignments
in parallel and sequence assignments with dependencies or overlapping edits.
If the architect cannot spawn agents directly, launch the workers from the main
session with the architect's task briefs and return their results to the
architect for review. If named roles are unavailable, use the corresponding
instructions from `.codex/agents/` in each launch message.

Choose the model and reasoning effort by assignment. The coordinating agent
classifies the architect's assignment, and the architect classifies each worker's
assignment separately. Include the selected pair and role in the task brief.

| Complexity | Model | Reasoning effort | Examples |
| --- | --- | --- | --- |
| Simple | `gpt-6-luna` | `high` | Local change with known behavior and a straightforward check |
| Moderate | `gpt-6.2-sol` | `medium` | Feature or bug fix with several affected modules or edge cases |
| Complex | `gpt-6.2-astra` | `high` | Cross-package contract change, migration, or hard-to-trace behavior |

For simple assignments, launch `architect_luna`, `frontend_luna`, or
`backend_luna` as appropriate. These profiles set the model and effort, so omit
both launch overrides. If a Luna profile is unavailable, try explicit Luna
`high` when the launch tool supports it. Otherwise use the base role with Sol
`low`. For moderate and complex assignments, use the base role and pass the
table's model and effort as launch parameters. Report any substitution.

The coordinating agent waits for the architect's integration review before
reporting changes and verification results. Include the model and effort used
for each agent so the choice can be checked.

## Project Structure & Module Organization

This repository has independent client and server npm packages. The React, TypeScript, and Vite client is in `client/`; its `src/` follows Feature-Sliced Design layers: `app`, `pages`, `widgets`, `features`, `entities`, and `shared`. Keep imports flowing down those layers; `npm run check:architecture` enforces boundaries. The TypeScript Express and Sequelize server is in `server/`; routes/controllers/middleware are under `src/`, and database models, migrations, and seeders under `db/`.

Consult `client/ARCH.md` when making client architecture decisions. Update it when a change alters the documented principles or boundaries.

Consult `server/ARCH.md` when making server changes. Follow its responsibility boundaries and dependency injection rules. Update it when a change alters the documented architecture.

## Build, Test, and Development Commands

- `cd client && npm run dev` starts Vite for development (API requests expect the server on port 3000).
- `cd client && npm run build` type-checks and builds the client into `server/dist`.
- `cd client && npm run lint` runs ESLint and checks FSD import boundaries; `npm run lint:ts` runs TypeScript checks alone.
- `cd client && npm test` runs the Vitest suite once.
- `cd server && npm run dev` starts the TypeScript API server in watch mode. `npm run typecheck` checks types, `npm run build` compiles the server, and `npm start` runs the compiled server. Configure PostgreSQL and environment variables before using the database; `npm run db` drops and recreates the development database, then migrates and seeds it.
- `cd server && npm test` builds the server and runs its Node test suite.

## Coding Style & Naming Conventions

Always use braces for `if` and `else` bodies, including single-line statements and early returns. This rule applies to both client and server code.

Format with two spaces, single quotes, semicolons, and trailing commas. Root and `client/.prettierrc` settings plus ESLint enforce style. Use PascalCase for components, camelCase for functions and variables, and kebab-case feature/page directories. Declare React component props with `interface`. Move component-specific helper functions to a sibling `helper.ts` file at the same directory level as the component. Name CSS/SCSS classes with BEM: `block__element_modifier` (for example, `.listing_card__title_featured`). Keep logic in its FSD slice.

### Entity Redux Files

For every Redux state module in `client/src/entities`, keep the slice, async thunks, model, and selectors in separate files with the same domain prefix:

- `{name}Slice.ts`: `createSlice`, initial state, reducers, and actions.
- `{name}Thunk.ts`: async thunks and their request orchestration.
- `{name}Model.ts`: state and payload interfaces/types, enums, and validation schemas.
- `{name}Selectors.ts`: selectors that read or derive values from the state.

For example: `likedAdvertsSlice.ts`, `likedAdvertsThunk.ts`, `likedAdvertsModel.ts`, and `likedAdvertsSelectors.ts`. Use the singular suffix `Thunk` for the file even when it exports multiple thunks. Do not put thunk definitions, model declarations, or selectors in the slice file. Selectors may import model types, but must not depend on slices or thunks. Models must not import slices or thunks; thunks may import models and API services, and slices may import models and thunk lifecycle actions. Keep these files in the owning entity's `model/` directory and respect FSD boundaries.

### TypeScript Enums

Use a regular TypeScript `enum` for a finite, named set of static string or numeric values, such as fixed browser routes and UI states. Do not use `as const` plus a derived union type as a substitute for such an enum. Do not use `const enum`.

Build parameterized URLs in route-builder functions with template strings. For example:

```ts
const listingDetails = (listingId: number) => `/listings/${listingId}`;
```

Validate or encode dynamic IDs as required by the route contract. Keep React Router parameter patterns such as `/listings/:listingId` in the router configuration, not in the static-route enum. Keep `as const` for tuple or object data whose shape is not a finite enum.

In `client/src`, place each React component with its SCSS Module in its own kebab-case directory within the FSD slice. Keep component-specific tests and helpers beside the component; keep shared code at the slice level only when it belongs to the whole slice.

In `client/src`, use relative imports for files within the same FSD slice or component directory. For imports across slices or layers, use the configured `@app`, `@pages`, `@widgets`, `@features`, `@entities`, and `@shared` aliases while respecting FSD boundaries.

## Testing Guidelines

Add client tests beside the behavior, named `*.test.ts` or `*.test.tsx`; Vitest and Testing Library are configured. Run `npm test`, `npm run lint`, and `npm run build` in `client/` for client changes. Run `npm test` and `npm run typecheck` in `server/` for server changes; use focused API/database checks where applicable.

## Commit & Pull Request Guidelines

Recent commits use a short `type: summary` format, for example `fix: refresh session` or `redesign: listing gallery`. Keep summaries specific and concise. PRs should explain changes, list checks, link related work, include UI screenshots, and note database or environment changes.

## Configuration & Secrets

Keep credentials and local environment files out of version control. Use `server/.env.exmaple` as the available environment-variable reference and configure database and token secrets locally.
