# Backend — FastAPI under `app/`

Package-style layout. Entrypoint is `app.main:app`. Settings come from the
environment with the `APP_` prefix. For *how to write the code* (Annotated
params, return types, dependencies, streaming, tooling), follow the bundled
**`fastapi`** skill — this doc only explains the scaffold's shape.

## Layout

```
app/
├── main.py            # FastAPI app: lifespan, CORS, request-logging mw, /health, /docs (Scalar)
├── core/
│   ├── config.py      # pydantic-settings — every field X ← env APP_X
│   ├── auth.py        # optional Bearer gate (APP_API_KEY empty = open)
│   ├── database.py    # Motor (async Mongo) client singleton: get_db(), close_mongo()
│   └── banner.py      # rich startup panel (cosmetic; extend with your own rows)
├── api/routes/
│   └── example.py     # demo router (prefix="/api") — replace it
├── schemas/           # Pydantic request/response models (example.py)
├── services/          # business logic (empty)
└── models/            # DB entities (empty)
```

## The `main.py` you start with

- **Startup banner** (`render_banner()`), then `yield`, then `close_mongo()` on shutdown — wired via `lifespan`.
- **Swagger/ReDoc disabled** (`docs_url=None`, `redoc_url=None`); API reference is served by **Scalar** at `/docs` (cleaner). `/openapi.json` stays available.
- **CORS** from `APP_CORS_ORIGINS` (csv) or localhost defaults.
- **Request-logging middleware** logs method, path, the `x-user-id` injected by the Next proxy, status, and latency.
- **`/health`** is unauthenticated (liveness probe; the Next config also rewrites `/health` to it).
- Routers are included with the **optional Bearer dependency** (`Depends(verify_api_key)`).

## Adding a feature (the layered way)

1. **Schema** in `app/schemas/<thing>.py` — Pydantic in/out models.
2. **Service** in `app/services/<thing>.py` — logic; talk to Mongo via `from app.core.database import get_db`.
3. **Router** in `app/api/routes/<thing>.py` — `APIRouter(prefix="/api", tags=["<thing>"])`, put shared deps at the router level. Register it in `main.py` with `app.include_router(...)`.

Follow the **`fastapi`** skill conventions: `Annotated[...]` params, a return type or `response_model` (this is also what filters out sensitive fields), one HTTP method per function, `def` for blocking code / `async def` only for awaited code.

## Config & auth

- `Settings` (`app/core/config.py`): `NAME`, `VERSION`, `DEBUG`, `BACKEND_PORT`, `FRONTEND_PORT`, `API_KEY`, `CORS_ORIGINS`, `MONGODB_URI`, `MONGODB_DB_NAME`. Add fields here; they read `APP_<FIELD>`.
- **Bearer gate** (`auth.py`): when `APP_API_KEY` is set, protected routes need `Authorization: Bearer <key>`. The Next proxy forwards this as `BACKEND_API_KEY` when configured. Empty = open (trusted network / dev).

## Runtime identity

The browser never calls the backend directly — the Next proxy injects **`x-user-id`** (the authenticated NextAuth user). Read it from the request headers in routes/services that need per-user scoping. See [`frontend.md`](frontend.md) for the proxy.
