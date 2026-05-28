# =============================================================================
# One image, two processes. Stage 1 builds the Next.js frontend as a
# standalone bundle; stage 2 is the Python backend that also carries that
# bundle. At runtime the entrypoint always starts the backend and starts the
# frontend only when passed `--frontend` (see docker-entrypoint.sh).
# =============================================================================

# --- Stage 1: build the Next.js frontend (standalone output) -----------------
FROM node:22-slim AS frontend-builder

WORKDIR /build

# Copy only the manifest first for better layer caching. `npm install` works
# without a committed lockfile; once you commit package-lock.json, switch to
# `npm ci` here for reproducible builds.
COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
# Next.js reads .env at build time — make sure a file exists so it won't fail.
RUN rm -f .env && touch .env
RUN npm run build

# --- Stage 2: final image — Python backend + (optional) frontend -------------
FROM python:3.12-slim

WORKDIR /app

# System deps: gosu for the privilege drop, Node.js 22 to run the standalone
# frontend server, curl/ca-certificates for healthchecks and the Node setup.
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates gosu \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Unprivileged runtime user (uid 1000).
RUN useradd --create-home --uid 1000 --shell /bin/bash app

# Python dependencies.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend application.
COPY app/ ./app/

# Frontend standalone build (server.js + minimal runtime), static assets, public.
COPY --from=frontend-builder /build/.next/standalone/ ./frontend/
COPY --from=frontend-builder /build/.next/static/ ./frontend/.next/static/
COPY --from=frontend-builder /build/public/ ./frontend/public/

# Persistent data dir (logs, uploads, …). Mount a volume here to keep it.
RUN mkdir -p /app/.data
VOLUME /app/.data

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

RUN chown -R app:app /app

EXPOSE 8000 3000

# The entrypoint starts as root only to fix volume ownership, then drops to
# `app` via gosu. Pass `--frontend` (in CMD or `docker run … --frontend`) to
# also start the UI; omit it for an API-only container.
ENTRYPOINT ["bash", "/app/docker-entrypoint.sh"]
CMD []
