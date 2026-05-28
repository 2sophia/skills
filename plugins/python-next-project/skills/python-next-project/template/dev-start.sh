#!/usr/bin/env bash
# Dev launcher: mongo (docker) + backend (uvicorn --reload) + frontend (next dev).
# Ctrl+C stops backend and frontend cleanly; the docker services keep running.
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -x .venv/bin/uvicorn ]]; then
  echo "❌ .venv/bin/uvicorn not found. Create the venv and install deps first:" >&2
  echo "   python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi
if [[ ! -d frontend/node_modules ]]; then
  echo "⚠️  frontend/node_modules missing — running npm install…"
  (cd frontend && npm install)
fi

echo "🐳  docker compose up -d mongo"
docker compose up -d mongo

LOG_DIR=".data/dev-logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

pids=()
cleanup() {
  echo
  echo "🛑  stopping backend and frontend…"
  for pid in "${pids[@]:-}"; do
    [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo "✅  done. (docker services stay up; stop them with: docker compose down)"
}
trap cleanup INT TERM EXIT

echo "🐍  backend  → http://localhost:8000   (log: $BACKEND_LOG)"
# --reload-exclude .data/*: runtime files written under .data/ must not
# trigger a reload (it would cut in-flight requests / streams).
.venv/bin/uvicorn app.main:app --reload --reload-exclude '.data/*' --port 8000 \
  >"$BACKEND_LOG" 2>&1 &
pids+=("$!")

echo "⚛️   frontend → http://localhost:3000   (log: $FRONTEND_LOG)"
(cd frontend && npm run dev) >"$FRONTEND_LOG" 2>&1 &
pids+=("$!")

echo
echo "📜  tail logs (Ctrl+C to stop everything):"
tail -n 0 -F "$BACKEND_LOG" "$FRONTEND_LOG"
