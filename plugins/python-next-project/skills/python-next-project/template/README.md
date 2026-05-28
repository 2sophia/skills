# myapp

Production-grade, containerized app: a **FastAPI** backend (the main server)
and a **switchable Next.js frontend**, building into **one Docker image**. Run
it full-stack or backend-only from the same image.

```
myapp/
├── app/                  # FastAPI backend (package): main, core/{config,auth,database,banner}, api/routes, schemas, services, models
├── frontend/             # Next.js (App Router) + NextAuth + shadcn + the authenticated proxy
├── Dockerfile            # multi-stage: build Next standalone → Python image carrying both
├── docker-entrypoint.sh  # backend always; frontend only with --frontend; gosu drop
├── docker-compose.yml    # mongo (dev) + commented prod deploy block
├── dev-start.sh          # dev launcher: mongo + uvicorn --reload + next dev
├── requirements.txt      # backend deps
└── .env.example          # APP_* (backend) + NextAuth (frontend)
```

## Develop

```bash
# backend deps
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env            # set NEXTAUTH_SECRET (and any secrets)

# frontend deps + base UI components (shadcn)
cd frontend && npm install && npx shadcn@latest add button input label card sonner && cd ..

# run everything (Ctrl+C stops backend+frontend; docker services stay up)
./dev-start.sh
```

- Backend → http://localhost:8000  (`/health`, API docs at `/docs`)
- Frontend → http://localhost:3000  (sign in at `/auth` — the **first** sign-in creates the admin account)

## Build & deploy

One image, two run modes:

```bash
docker build -t your-registry/myapp:0.1.0 .
docker push your-registry/myapp:0.1.0

docker run -p 8000:8000 -p 3000:3000 --env-file .env your-registry/myapp:0.1.0 --frontend  # full stack
docker run -p 8000:8000 --env-file .env your-registry/myapp:0.1.0                            # backend-only (API)
```

For production with compose, uncomment the app service in `docker-compose.yml`
and put a real `.env` next to it.

## Configuration

Backend env uses the `APP_` prefix (read by pydantic-settings); the frontend
(NextAuth, server-side) uses un-prefixed vars. See `.env.example` for the full
list. The browser never calls the backend directly — requests go through the
Next proxy at `/api/backend/*`, which validates the session and injects
`x-user-id`.
