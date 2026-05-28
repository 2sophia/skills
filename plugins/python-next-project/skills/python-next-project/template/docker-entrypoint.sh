#!/usr/bin/env bash
set -euo pipefail

# ─── Privilege drop ──────────────────────────────────────────────────────────
# Start as root only to fix the ownership of the mounted /app/.data volume
# (it may carry root-owned files from a previous deployment), then re-exec
# ourselves as the unprivileged `app` user via gosu. The second invocation is
# already `app` and skips this block.
if [ "$(id -u)" = "0" ]; then
    chown -R app:app /app/.data 2>/dev/null || true
    exec gosu app "$0" "$@"
fi

BACKEND_PORT="${APP_BACKEND_PORT:-8000}"
FRONTEND_PORT="${APP_FRONTEND_PORT:-3000}"

BACKEND_PID=
FRONTEND_PID=

cleanup() {
    echo "[entrypoint] shutting down…"
    [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    wait
    exit 0
}
trap cleanup SIGTERM SIGINT

# Frontend is opt-in: pass `--frontend` to run the full stack, omit it for an
# API-only container. Export a flag so the backend banner reflects the mode.
if [[ "${1:-}" == "--frontend" ]]; then
    export _APP_FRONTEND_RUNNING=1
fi

echo "[entrypoint] backend → :${BACKEND_PORT}"
uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --workers 1 &
BACKEND_PID=$!

if [[ "${1:-}" == "--frontend" ]]; then
    export FASTAPI_URL="${FASTAPI_URL:-http://localhost:${BACKEND_PORT}}"
    echo "[entrypoint] frontend → :${FRONTEND_PORT}  (backend ${FASTAPI_URL})"
    cd /app/frontend
    HOSTNAME=0.0.0.0 PORT="$FRONTEND_PORT" node server.js &
    FRONTEND_PID=$!
fi

# If either process dies, tear down the other and exit.
wait -n
echo "[entrypoint] a process exited unexpectedly — shutting down"
cleanup
