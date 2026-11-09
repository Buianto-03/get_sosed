# Get Sosed

Get Sosed helps people find housing to share and get in touch with potential roommates. Visitors can filter listings by city, price, number of rooms, and living arrangements. After signing in, they can publish a listing with photos, save favorites, and message the person who posted a listing.

The React client and Express server are written in TypeScript. The server stores data in PostgreSQL and delivers chat messages over WebSocket.

## Run locally with Docker

Run the following commands from the repository root with Docker Compose installed. The local database and server settings are included in [compose.yaml](compose.yaml).

1. Start PostgreSQL. Repeat the readiness check until it reports `accepting connections`.

   ```sh
   docker compose up -d db
   docker compose exec -T db pg_isready -h 127.0.0.1 -U learner -d get-sosed
   ```

2. Apply the migrations to create the tables and populate the basic living arrangement tags.

   ```sh
   docker compose run --rm --build migrate
   ```

3. On a fresh database, seed the `Admin` and `User` roles. Registration expects the `User` role to have ID 2. Run this step once per new database volume.

   ```sh
   docker compose run --rm migrate ./node_modules/.bin/sequelize db:seed --seed 20240822073001-Roles.js
   ```

4. Start the server, then the client. Set `COOKIE_SECURE=false` for local HTTP so the browser can send the session cookie.

   ```sh
   COOKIE_SECURE=false docker compose up -d --build server
   docker compose up -d --build client
   ```

Open the [listings page](http://127.0.0.1:8082/listings). On a fresh database, the [listings API](http://127.0.0.1:8082/api/adverts) returns `[]`. Sign up and publish a listing to see it in the catalog.

Run `docker compose down` to stop the application. PostgreSQL data and uploaded photos persist in the `postgres_data` and `uploads_data` volumes.

## Develop without Docker

Use Node.js 22 and npm. The client and server each have their own `package.json` and lockfile. Running `npm ci` at the repository root installs the Git hook tooling.

1. Set up PostgreSQL, configure the server environment, and start the API on port 3000. The development seed data includes listings and conversations. [Server setup](server/README.md)
2. Start Vite in a second terminal. It forwards API, image, and chat requests to the server. [Client setup](client/README.md)

For HTTP endpoints and chat events, see the [OpenAPI specification](server/docs/openapi.yaml) and the [HTTP and WebSocket guide](server/docs/README.md).

## CI/CD

### Continuous integration

GitHub Actions runs five jobs in parallel on pushes and pull requests. The two npm jobs use Node.js 22 and install dependencies with `npm ci`. [CI workflow](.github/workflows/ci.yaml)

| Job | What it checks |
| --- | --- |
| `client` | Runs ESLint and the architecture checks, executes the Vitest suite, and builds the client. |
| `server` | Type-checks the server, then compiles it and runs the Node.js test suite. |
| `docker-client` and `docker-server` | Build both Docker images, check that the server image can load Express, Sharp, and bcrypt, and validate the Compose configuration. |
| `compose-integration` | Starts PostgreSQL, applies migrations, and checks the running stack through Nginx. It verifies that `/api/adverts` returns `[]`, `/listings` serves the React page, a missing image returns 404, and a plain HTTP request to `/ws` returns 426. |

### Publishing release images

After all five jobs pass on a push to `release/initial`, the `publish-images` job builds `get-sosed-client` and `get-sosed-server` and tags each image with the commit SHA. It checks the Nginx configuration and server dependencies, then tests those images together. The test applies migrations, verifies the seeded role IDs, and queries the listings API. [Compose configuration for testing release images](compose.ci-images.yaml)

The job pushes both images to GitHub Container Registry (GHCR) and uploads an Actions artifact named `deploy-images-<commit-sha>`. Inside, `deploy-images.json` records the commit and both image references pinned by SHA-256 digest. The deployment workflow uses these references to pull the same images that passed CI.

### Deploying to production

Production deployments are triggered manually in GitHub Actions. The workflow allows one active deployment at a time.

1. In GitHub Actions, open `deploy-production.yaml`, choose **Run workflow**, and select `release/initial`. Leave `ci_run_id` empty to deploy the commit at the tip of that branch when you dispatch the workflow. To deploy an earlier release, enter the numeric ID of its successful CI run. [Production deployment workflow](.github/workflows/deploy-production.yaml)
2. The workflow verifies that the selected CI run came from a push to `release/initial` in this repository and that `publish-images` succeeded. It downloads `deploy-images.json`, matches the commit to the selected run, and validates both GHCR image references.
3. GitHub Actions uses OpenID Connect (OIDC) to assume the AWS role configured in `AWS_ROLE_ARN`. It sends the two image references to the `GetSosed-DeployProduction` command in AWS Systems Manager (SSM) and waits for the result. The `AWS_REGION` and `EC2_INSTANCE_ID` variables identify the deployment target. [SSM command document](infrastructure/ssm/deploy-production.yaml)
4. On EC2, the installed script takes a deployment lock, reads the GHCR credential from SSM Parameter Store, and pulls the images by digest. It backs up PostgreSQL with `pg_dump`, applies migrations, updates `production.env`, and starts the server and client containers. The final check requires a successful HTTP response from `http://127.0.0.1:8082/api/adverts`. [Deployment script](scripts/deploy-production.sh) · [Production Compose configuration](compose.production.yaml)

The pre-deployment dump is stored on the EC2 host. Uploaded photos need a separate backup. Before deploying an earlier image pair, check that it supports the current database schema. Recovery after a failed deployment is manual. [Deployment runbook and troubleshooting](docs/production-deploy.md)

A separate manual workflow checks the GitHub OIDC connection to AWS by assuming the role and querying the AWS account identity. [AWS connection check](.github/workflows/aws-connection-check.yaml)
