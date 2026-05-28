# Docker — one image, switchable frontend

The defining trait of this scaffold: **a single image** carries the FastAPI
backend *and* the built Next.js frontend, and the **frontend is opt-in at
runtime**. Same artifact → full-stack or API-only.

## Multi-stage build (`Dockerfile`)

- **Stage 1 (`node:22-slim`)** builds the frontend. `next.config.ts` has
  `output: "standalone"`, so the build emits a self-contained server bundle.
  (Template uses `npm install`; commit `package-lock.json` and switch to
  `npm ci` for reproducible builds.)
- **Stage 2 (`python:3.12-slim`)** is the runtime: installs Python deps + Node
  22 (to run the standalone frontend) + `gosu`, copies `app/`, then copies the
  standalone build into `frontend/` (`server.js`, `.next/static`, `public`).
  Creates an unprivileged `app` user (uid 1000), declares `VOLUME /app/.data`,
  exposes `8000` + `3000`.

## The switchable entrypoint (`docker-entrypoint.sh`)

1. **Privilege drop:** starts as root *only* to `chown` the mounted `/app/.data`
   volume, then re-execs itself as `app` via `gosu`.
2. **Backend always starts:** `uvicorn app.main:app` on `APP_BACKEND_PORT` (8000).
3. **Frontend starts only with `--frontend`:** `node server.js` on
   `APP_FRONTEND_PORT` (3000), with `FASTAPI_URL` pointed at the local backend.
4. `trap` + `wait -n`: if either process dies, the other is torn down.

```bash
docker run … myapp --frontend     # full stack (UI + API)
docker run … myapp                # backend-only (API)
```

## Compose (`docker-compose.yml`)

- **`mongo`** runs as a dev support service (brought up by `dev-start.sh`).
  In prod, point `APP_MONGODB_URI` / `MONGODB_URI` at a managed instance instead.
- The **app service is a commented "gold deploy block"** — uncomment it on the
  prod host. It pulls the image you built+pushed, wires the `APP_*` + NextAuth
  env, and sets `command: ["--frontend"]`. **Drop that command line to run
  backend-only** from the same image.

## Dev loop (`dev-start.sh`)

`docker compose up -d mongo`, then `uvicorn --reload` (excludes `.data/`) and
`next dev`, logging to `.data/dev-logs/`. Ctrl+C stops both processes; the
docker services keep running (`docker compose down` to stop them).

## Build → push → deploy

```bash
# on the dev/build host
docker build -t your-registry/myapp:0.1.0 .
docker push your-registry/myapp:0.1.0

# on the prod host: put a real .env next to docker-compose.yml,
# uncomment the app service, then
docker compose up -d
```

Backend-only deploy = identical steps, just omit `command: ["--frontend"]`.

## What's excluded from the image (`.dockerignore`)

`.env*`, `.data/`, `.venv/`, `frontend/node_modules`, `frontend/.next`,
`dev-start.sh`, the Dockerfile/compose themselves, `README.md`, `pyproject.toml`
(dev-only), caches. The frontend is rebuilt *inside* the image from source.

## Ports & env recap

| Env | Default | Used by |
|---|---|---|
| `APP_BACKEND_PORT` | 8000 | uvicorn + entrypoint |
| `APP_FRONTEND_PORT` | 3000 | `node server.js` + entrypoint |
| `FASTAPI_URL` | `http://localhost:8000` | Next proxy → backend |

Keep secrets out of the image: pass `APP_API_KEY`, `NEXTAUTH_SECRET`, Mongo
URIs as runtime env (compose `environment:` / `docker run -e`), never baked in.
