# Repository Guidelines

## Codex Implementation Workflow

Inspect the relevant code and present a short plan before implementation edits.
State the intended behavior, affected packages, dependencies, and verification
steps. In Plan mode, wait until the user starts implementation. In Default mode,
proceed when the user has requested implementation.

Use one agent by default. For a client/server contract change, the coordinator
assigns one `architect` to own the contract and integration review. The architect
delegates client and server implementation to `frontend` and `backend` for the
packages that need edits. Use additional agents when the user asks for them or
the work has independent assignments with separate ownership. Run independent
assignments in parallel and sequence edits that depend on each other or overlap.

Give each agent a short brief with its role, owned paths, agreed behavior and
interfaces, relevant constraints, success criteria, and checks. Share a concise
handoff and references to relevant files. Assign one owner to each decision and
each verification run. If the architect cannot spawn workers directly, the
coordinator launches them from those briefs and returns their findings to the
architect. If named roles are unavailable, use the corresponding instructions
from `.codex/agents/` in the launch brief.

The coordinator selects the architect's model. The architect defines the
interfaces, state ownership, edge cases, and integration criteria, then divides
implementation into bounded assignments for frontend and backend workers.
Each assignment should deliver a complete behavior that can be implemented and
checked independently. Keep tightly coupled invariants, such as a reconnect
cursor and its retry transitions, with one owner.

Use the following model choices for delegated work.

| Assignment | Model | Reasoning effort | Examples |
| --- | --- | --- | --- |
| Bounded frontend or backend implementation | `gpt-6-luna` | `high` | Agreed validation, query, event handler, component, or regression fix |
| Visual and browser verification | `gpt-6.1-terra` | `medium` | Responsive layout, keyboard focus, scrolling, and screenshots |
| Implementation needing additional engineering decisions | `gpt-6.2-sol` | `medium` | An unresolved race, integration failure, or behavior spanning coupled modules |
| Architecture and integration review | `gpt-6.2-sol` | `medium` | Decomposition, ownership, interfaces, and review against the agreed contract |
| Complex architecture and contract review | `gpt-6.2-astra` | `high` | Cross-package protocol, migration strategy, or hard-to-trace concurrency |

Luna is the default code implementer. Give it the accepted design, relevant
existing patterns, and behavioral checks. Use `frontend_luna` or `backend_luna`;
these profiles set the model and effort, so omit launch overrides. For Terra
and Sol, use a matching available role with explicit model and effort. If a
profile is unavailable, use its instructions from `.codex/agents/` with an
available role and the intended model. Report any model substitution.

After an unsuccessful implementation attempt, the architect or coordinator
diagnoses the failure and clarifies the assignment. Escalate a coupled or
ambiguous implementation to Sol when it requires an additional engineering
decision. Keep Astra focused on architecture and contract review. Include the
role, model, effort, and reason for any escalation in the brief and final report.
For a short local change, the single agent implements and verifies it directly.

Each implementer runs focused checks during development. The coordinator or
architect assigns the required full checks to one owner per affected package.
Run final measurements after the implementation stabilizes when required. Reuse
successful results for the same code and rerun when a change affects the check
or a failure needs diagnosis. Return concise results and relevant errors. Keep
full logs or measurement data available by path when needed.

For interrupted work, resume from a short handoff with the branch and commit,
changes in progress, completed checks, and remaining criteria. Keep the handoff
in the existing task journal when one is already in use. The coordinator waits
for the architect's integration review when an architect is assigned and
reports the model and effort used by each participating agent.

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
