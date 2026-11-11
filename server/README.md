# Get Sosed server

The TypeScript and Express server provides the HTTP API and WebSocket chat. It uses Sequelize to store listings, profiles, favorites, and messages in PostgreSQL. Sharp processes uploaded photos.

## Run locally

Use Node.js 22, npm, and a running PostgreSQL instance. The Docker configuration uses PostgreSQL 16. Run the commands from `server/` because the server resolves image and client build paths relative to its working directory. For the first launch, install dependencies and copy the [environment template](.env.exmaple).

```sh
npm ci
cp .env.exmaple .env
```

Fill in `server/.env` with your local settings.

| Variable | Local development value |
| --- | --- |
| `DB_HOST` | PostgreSQL host, for example `127.0.0.1`. |
| `DB_NAME` | A dedicated development database name, for example `get_sosed_dev`. |
| `DB_USER`, `DB_PASS` | PostgreSQL role and password. The role needs permission to create databases to run `db:create`. |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | Two distinct random strings for signing JWTs. Generate each with `openssl rand -hex 32`. |
| `PORT` | API port. Defaults to `3000`, which is also the target of the Vite proxy. |
| `COOKIE_SECURE` | Add `COOKIE_SECURE=false` for local HTTP. By default, the refresh cookie has the `Secure` flag. |

### Prepare the database

For a first installation with sample data, create a database, apply the migrations, and run the seeders. If you already have an empty database, start with `db:migrate`.

```sh
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

The seeders populate roles, users, listings, and conversations. Run `db:seed:all` once on a fresh database. For later schema changes, run `npx sequelize-cli db:migrate`.

**`npm run db` drops the development database and deletes its data.** Use it for a full local reset. It recreates the database, applies migrations, and loads the sample data.

### Start the API

```sh
npm run dev
```

The server restarts when source files change. From another terminal, query the public listings endpoint. A JSON array confirms the API can read from PostgreSQL.

```sh
curl --fail http://localhost:3000/api/adverts
```

## API and file storage

- `/api/adverts` and `/api/likes` handle listing search, publishing, a user's own listings, and favorites.
- `/api/users` serves profiles and conversation lists. Chat messages are sent over WebSocket at `/ws`.
- `/api/auth` and `/api/tokens` handle registration, sign-in, sign-out, and session refresh. Send `Authorization: Bearer <accessToken>` with protected HTTP requests. Session refresh and WebSocket connections use the HttpOnly `refreshToken` cookie.
- `/images/` serves photos from `server/public/images/`. The server saves new uploads as WebP files. Docker stores this directory on a separate volume.

For request parameters, response formats, and chat examples, see the [HTTP API specification](docs/openapi.yaml) and the [HTTP and WebSocket guide](docs/README.md).

## Source layout

- `src/server.ts` starts the HTTP server. `src/app.ts` connects routes, static files, and WebSocket handlers.
- `src/router/` defines routes and their middleware order. Request middleware lives in `src/middlewares/`. Controllers in `src/controllers/` handle HTTP requests and responses. Services in `src/service/` perform data and file operations. Chat handlers live in `src/ws/`.
- `db/models/`, `db/migrations/`, and `db/seeders/` contain Sequelize models, migrations, and seed data. The database connection settings are in [config/database.js](config/database.js).

For dependency injection, transactions, and error handling, see [ARCH.md](ARCH.md).

## Checks and builds

| Command from `server/` | What it does |
| --- | --- |
| `npm run typecheck` | Checks TypeScript types without writing files. |
| `npm test` | Builds the server and runs `tests/*.test.js` with the Node.js test runner. |
| `npm run build` | Compiles TypeScript to `build/`. |
| `npm start` | Runs the compiled `build/src/server.js` with `NODE_ENV=production`. Run `npm run build` first. |

In production mode, Sequelize reads `DB_HOST_PROD`, `DB_NAME_PROD`, `DB_USER_PROD`, and `DB_PASS_PROD`. The `npm run db:setup` script creates a database in that environment, applies migrations, and runs all available seeders. For production releases, follow the [deployment runbook](../docs/production-deploy.md).
