"""FastAPI application entry point.

Boots the app, prints the startup banner, wires CORS + request logging,
and exposes a liveness probe (`/health`) and Scalar-powered API docs
(`/docs`). Domain routers live under `app/api/routes/` and are registered
below — start by replacing `example`.
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.api.routes import example as example_routes
from app.core.auth import verify_api_key
from app.core.banner import render_banner
from app.core.config import settings
from app.core.database import close_mongo

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
# pymongo emits a DEBUG line per heartbeat — unreadable when tailing logs.
logging.getLogger("pymongo").setLevel(logging.WARNING)
if not settings.DEBUG:
    for _noisy in ("httpcore", "httpx", "urllib3"):
        logging.getLogger(_noisy).setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    render_banner()
    yield
    await close_mongo()


app = FastAPI(
    title=settings.NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    # Docs served via Scalar at /docs; default Swagger/ReDoc disabled.
    docs_url=None,
    redoc_url=None,
)

# --- CORS ---
_cors_origins = (
    [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    if settings.CORS_ORIGINS
    else [
        f"http://localhost:{settings.FRONTEND_PORT}",
        f"http://localhost:{settings.BACKEND_PORT}",
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    # The Next.js proxy injects the authenticated user id as x-user-id.
    user_id = request.headers.get("x-user-id", "-")
    t0 = time.monotonic()
    response = await call_next(request)
    elapsed = (time.monotonic() - t0) * 1000
    logger.info(
        "%s %s user=%s status=%d %.1fms",
        request.method, request.url.path, user_id, response.status_code, elapsed,
    )
    return response


# --- Routers (protected by the optional Bearer gate) ---
_auth = [Depends(verify_api_key)]
app.include_router(example_routes.router, dependencies=_auth)


@app.get("/health", include_in_schema=False)
async def health_check():
    """Liveness probe. No auth required."""
    return {"status": "healthy", "service": settings.NAME, "version": settings.VERSION}


@app.get("/docs", include_in_schema=False)
async def scalar_docs():
    """API reference rendered by Scalar (cleaner than Swagger UI)."""
    return HTMLResponse(f"""<!doctype html>
<html>
<head>
    <title>{settings.NAME} — API Reference</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ margin: 0; }}
        :root {{ --scalar-color-accent: #6366f1; }}
    </style>
</head>
<body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
        Scalar.createApiReference("#app", {{
            "url": "/openapi.json",
            "_integration": "fastapi",
            "darkMode": true
        }})
    </script>
</body>
</html>""")
