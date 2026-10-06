# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"get-sosed" is a roommate/apartment-listing app (Russian-language UI and comments): users post adverts (flats with photos, location, tags), like them, and chat with each other in real time. Monorepo with two independent npm packages, `client/` and `server/` — there is no root workspace, so run `npm install` and scripts inside each directory. No test suite exists.

## Commands

Server (`cd server`; must be run from this directory — paths like `./public/images/...` are relative to cwd):
- `npm run dev` — nodemon on `src/server.js` (port `PORT` or 3000)
- `npm run db` — drop, create, migrate and seed the dev database (sequelize-cli; paths configured in `.sequelizerc`)
- `npm start` / `npm run db:setup` — production variants (`NODE_ENV=production`, uses `*_PROD` env vars from `config/database.js`)
- Env: copy `server/.env.exmaple` (sic) to `.env` — `PORT`, `DB_USER/NAME/HOST/PASS`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`. Database is PostgreSQL.

Client (`cd client`):
- `npm run dev` — Vite dev server; proxies `/api` and `/images` to `http://localhost:3000`
- `npm run build` — `tsc && vite build`, output goes to **`../server/dist`**, which the Express server serves as the SPA (catch-all `/*` → `dist/index.html`)
- `npm run lint` — ESLint (airbnb + airbnb-typescript + type-checked rules, `--max-warnings 0`); requires explicit function return types and `import type` for type-only imports

Prettier config (root and `client/`): single quotes, trailing commas, 80 cols.

## Architecture

**Server** (CommonJS, Express + Sequelize):
- `src/app.js` builds the Express app and wraps it in an `http.Server`, which is what it exports (so `server.js` calls `.listen` on the HTTP server, not the Express app). Routes are mounted under `/api/{adverts,users,tokens,auth,likes}`; any other `/api/*` request is proxied to `https://api-maps.yandex.ru`.
- Layering: `router/` → `controllers/` (classes instantiated with a service, methods as arrow properties) → `service/` (classes wrapping Sequelize models from `db/models`).
- Auth is JWT with two tokens (`utils/generateTokens.js`, `configs/jwtConfig.js`): a short-lived access token sent as `Authorization: Bearer …` (checked by `middlewares/verifyAccessToken`, which returns **403** on failure) and a refresh token in an httpOnly cookie (`verifyRefreshToken`, used by `GET /api/tokens/refresh`). The authenticated user is placed on `res.locals.user`.
- Image uploads: multer in-memory storage (`middlewares/getImage.js`), converted to webp with `sharp`, and written to `public/images/adverts/advert-<id>/advert<id>-<i>.webp` (users under `public/images/users/user-<id>/`). `public/` is served statically, so these are reachable at `/images/...`.
- WebSocket chat (`src/ws/`): `upgrade.js` authenticates the upgrade request from the **refresh token cookie**, then `connection.js` keeps an in-memory `Map` of userId → socket. Messages are JSON `{type, payload}` actions (`SET_USERS`, `INITIALIZE`, `SET_MESSAGES`, `SEND_MESSAGE`/`NEW_MESSAGE`, `ADD_MESSAGE`) persisted to the `Chat` model. Note there are two separate `socket.on('message')` handlers.
- DB: migrations/models/seeders in `server/db/`; main models are User, Role, UserProfile, UserPhoto, Advert, AdvertPhoto, Location, Tags, AdvertTags, Like, Chat. Seeders reference the committed images in `server/public/images`.

**Client** (React 18 + TypeScript + Vite, Redux Toolkit, Chakra UI with some react-bootstrap/reactstrap, Yandex Maps):
- Routing is defined in `components/hooks/useAppRouter.tsx` (`createBrowserRouter`), with `ProtectedRoute` gating on `auth.user.status` (`UserStatus.Logged` / `Guest`).
- Data flow: `services/*Service.ts` (API calls via the shared axios instance) → `redux/slices/<domain>/` (slice + `createAsyncThunk` thunks) → components via typed hooks in `redux/hooks.ts`.
- `services/client.ts` is the axios instance (`baseURL: '/api'`). It gets the store via `injectStore`, attaches the access token to every request, and on a **403** transparently calls `/api/tokens/refresh`, dispatches `auth/setAccessToken`, and retries once.
- Response shapes are validated with zod schemas in `src/types/`.
- Chat pages (`pages/Account/ChatPage.tsx`, `AccountPage.tsx`) open WebSockets to a hardcoded `ws://localhost:3000`.
