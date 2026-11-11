# Get Sosed client

The client is a React and TypeScript application. React Router maps URLs to pages, and Redux Toolkit manages session, listing, favorites, and chat state. The client uses Axios for HTTP requests, Zod to validate API responses, and SCSS Modules to style components.

## Run locally

Use Node.js 22 and npm. Set up PostgreSQL and start the API on port 3000 using the [server setup guide](../server/README.md). In a second terminal, run the following commands from `client/` for the first launch.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open the address printed by Vite, usually [http://localhost:5173](http://localhost:5173). Vite proxies `/api`, `/images`, and the `/ws` WebSocket connection to `http://localhost:3000`. This keeps browser requests on the same origin so the API and chat can use the `refreshToken` cookie. [Vite configuration](vite.config.ts)

### Environment variables

| Variable in `client/.env` | Purpose |
| --- | --- |
| `VITE_API_URL` | HTTP API base URL. Defaults to `/api`. Include the `/api` path when setting an absolute URL. |
| `VITE_WS_URL` | Full WebSocket URL for chat. Defaults to `/ws` on the current host, using `ws://` for HTTP and `wss://` for HTTPS. |
| `VITE_YANDEX_API_KEY` | Yandex Maps key for displaying maps and geocoding listing addresses. Listings can also be published with a text address and no coordinates. |

Vite reads these values when the development server starts or the production bundle is built. Restart Vite or rebuild after editing `.env`. The template also lists `VITE_APP_TITLE`. To change the browser tab title, edit [index.html](index.html).

## Routes

| Access | Routes | Pages |
| --- | --- | --- |
| Public | `/`, `/about` | Home page and service overview |
| Public | `/listings`, `/listings/:listingId` | Listing search and listing details |
| Guests | `/sign-in`, `/sign-up` | Sign-in and registration |
| Signed-in users | `/profile`, `/profile/edit` | Profile, published listings, favorites, and profile editing |
| Signed-in users | `/listings/new` | Publish a listing with photos |
| Signed-in users | `/messages`, `/messages/:receiverId` | Conversation list and chat with a specific user |

When a guest opens a protected page, the client saves the requested URL so they can return after signing in. Routes and access rules are defined in [router.tsx](src/app/router/router.tsx).

## Source layout

The `src/` directory follows Feature-Sliced Design. The `app` layer configures routing and the Redux store. Pages live in `pages`, larger interface sections in `widgets`, and user actions in `features`. Domain models and their API calls belong in `entities`. Shared components and configuration live in `shared`. See the import rules and Redux conventions in [ARCH.md](ARCH.md).

Shared styles live in `src/shared/styles/`. For visual conventions and reusable components, see the [design specification](DESIGN.md) and the [UI kit](src/shared/ui/README.md). The [integration log](../docs/redesign-integration-progress.md) records the screen migration and manual checks.

## Checks and builds

| Command from `client/` | What it does |
| --- | --- |
| `npm test` | Runs Vitest once. Tests live alongside the source. Component tests use jsdom and React Testing Library. |
| `npm run lint` | Runs ESLint and checks Feature-Sliced Design import boundaries. |
| `npm run check:architecture` | Checks import boundaries on their own. |
| `npm run lint:ts` | Checks TypeScript types. |
| `npm run build` | Type-checks the client and writes the Vite build to `../server/dist`. |

When running the server from the repository, Express can serve the built client from `server/dist/`. In Docker, Nginx serves the client files.
