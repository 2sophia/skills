---
name: python-next-project
description: Use this skill when a developer wants to scaffold, bootstrap, or "start a new project" that is a production-grade, Docker-containerized app with a Python (FastAPI) backend and an optional Next.js frontend. The whole thing builds into ONE Docker image where the frontend is switchable at runtime (`--frontend` flag) — so the same artifact ships as a full-stack app OR as a backend-only API. It lays down the project structure, a multi-stage Dockerfile, docker-compose, a dev launcher, NextAuth + MongoDB auth (first-login bootstrap), the Next proxy that injects the user identity, and shadcn UI wired up. Auth and shadcn are installed and cabled but NOT a finished app — pure base. Reach for this for "containerized Python + Next starter", "prod scaffolding", "FastAPI + Next.js boilerplate with Docker", "deploy backend with optional UI". This plugin also bundles the official FastAPI and shadcn skills — use them for backend conventions and UI work.
---

# python-next-project

Scaffold a **production-grade, containerized** application: a Python **FastAPI** backend that is the main server, plus a **switchable Next.js frontend**, both building into **one Docker image**. Run it full-stack or backend-only from the *same* image. Auth (NextAuth + MongoDB) and shadcn UI come pre-wired but empty — you get the base, not a finished product.

This skill is an **orchestrator**. It owns the project *shape* and the *prod glue* (Docker, the switchable entrypoint, the auth/proxy plumbing, the dev loop). For the two domains that have authoritative guidance, it defers to bundled skills:

- **Backend code (endpoints, Pydantic, dependencies, streaming, tooling)** → the bundled **`fastapi`** skill.
- **UI (adding/composing components, styling, the CLI)** → the bundled **`shadcn`** skill.

---

## 🥇 Golden rules (read every time)

### 1. The template is the source of truth — copy it, don't reinvent it
The scaffold lives in [`template/`](template/) next to this file. Your job is to **copy it, rename the dotfiles, and substitute the placeholder** — not to regenerate files from memory. The files encode decisions (standalone Next build, gosu drop, proxy auth) that are easy to get subtly wrong by hand.

### 2. One image, two processes, frontend **switchable** — never break this
The backend **always** runs (`uvicorn app.main:app`). The frontend runs **only** when the entrypoint gets `--frontend`. This is the whole point: the same image deploys as full-stack (`command: ["--frontend"]`) or backend-only (no flag). Anything you add must keep the **backend runnable standalone**. Don't make the API import or depend on the frontend.

### 3. The backend is a package under `app/`; the frontend lives under `frontend/`
Entrypoint is `app.main:app`. Don't flatten the backend to the repo root, don't merge the two trees. Backend Python is English; keep domain logic out of `core/`.

### 4. Env is split by side, and the browser never touches the backend directly
- **Backend** reads `APP_*` via `pydantic-settings` (`app/core/config.py`). Every field `X` ← env `APP_X`.
- **Frontend** (NextAuth, server-side) reads **un-prefixed** vars (`NEXTAUTH_SECRET`, `MONGODB_URI`, `AUTH_DB`, `FASTAPI_URL`, …).
- The Next **proxy** (`app/api/backend/[...path]/route.ts`) validates the NextAuth session server-side and injects `x-user-id` before forwarding to FastAPI. The client calls `lib/api.ts` → `/api/backend/*`; it never calls FastAPI directly. Keep it that way (it's the authz boundary).

### 5. Don't hand-roll shadcn components — use the bundled `shadcn` skill
`components.json`, `globals.css` (tokens), and `lib/utils.ts` ship in the template. The actual UI primitives (`button`, `input`, `label`, `card`, `sonner`, …) are added with the shadcn CLI. Follow the bundled **`shadcn`** skill for `shadcn add`, composition, and styling rules. The scaffold's own components (`login-form`, `user-menu`, dashboard) import these primitives, so you **must** add them or the frontend won't compile (see workflow step 6).

### 6. Write backend code the FastAPI way — use the bundled `fastapi` skill
When adding endpoints/models, follow the bundled **`fastapi`** skill: `Annotated` params, return types / `response_model`, router-level `prefix`/`tags`/`dependencies`, `def` vs `async def`, no `RootModel`, no deprecated JSON responses.

### 7. Replace the placeholder `myapp`, keep the `APP_` prefix
The template uses **`myapp`** as the project-name placeholder and **`APP_`** as the backend env prefix. Substitute `myapp` everywhere with the user's real name; **leave `APP_` as-is** (it's the agreed namespace).

### 8. Secrets never get committed or baked
`.env` is gitignored; only `.env.example` is tracked. Don't bake secrets into the image — pass them as env at `docker run` / in compose. `NEXTAUTH_SECRET` must be set in production.

---

## 🚦 Workflow — scaffold a new project

> Run from the directory where the new project should live. Substitute `<name>` with the user's project name.

1. **Confirm the name.** Ask for the project name if not given (used to replace `myapp`). Both run-modes (full-stack / backend-only) come from the *same* scaffold — no need to choose now.

2. **Copy the template** into the target dir:
   ```bash
   cp -r <skill>/template <name> && cd <name>
   ```

3. **Rename the dotfiles** (shipped without the leading dot so they survive packaging):
   ```bash
   mv dot-gitignore .gitignore
   mv dot-dockerignore .dockerignore
   mv dot-env.example .env.example
   ```

4. **Replace the placeholder** `myapp` → `<name>` across the tree (keep `APP_`):
   ```bash
   grep -rl --exclude-dir=node_modules --exclude-dir=.venv myapp . \
     | xargs sed -i 's/myapp/<name>/g'
   ```
   Sanity-check `app/core/config.py`, `.env.example`, `docker-compose.yml`, and `frontend/app/layout.tsx`.

5. **Backend deps + env:**
   ```bash
   python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
   cp .env.example .env            # then edit secrets (NEXTAUTH_SECRET at least)
   ```

6. **Frontend deps + shadcn primitives** (follow the bundled **`shadcn`** skill):
   ```bash
   cd frontend && npm install
   npx shadcn@latest add button input label card sonner
   cd ..
   ```
   These five are what the scaffold's own components import. Add more as you build (`dropdown-menu`, `avatar`, `dialog`, …) per the shadcn skill.

7. **Run it (dev):**
   ```bash
   ./dev-start.sh          # mongo (docker) + uvicorn --reload + next dev
   ```
   Backend on `:8000` (`/health`, `/docs`), frontend on `:3000`. First sign-in at `/auth` creates the admin account; the dashboard then shows the backend's `/api/example` message — that round-trip proves the proxy + auth + backend are all wired.

8. **Build & ship (prod):** see [`docker.md`](docker.md). One image; `--frontend` decides full-stack vs API-only.

---

## 🌳 Decision tree — where to look

| The user wants to… | Go to |
|---|---|
| Understand the backend layout / add an endpoint, schema, service | [`backend.md`](backend.md) + bundled **`fastapi`** skill |
| Write idiomatic FastAPI (Annotated, response_model, deps, streaming) | bundled **`fastapi`** skill (`SKILL.md` + `references/`) |
| Understand the frontend / auth flow / the proxy + `x-user-id` | [`frontend.md`](frontend.md) |
| Add or compose UI components, styling, theming | bundled **`shadcn`** skill (`SKILL.md`, `cli.md`, `rules/`) |
| Build the image, deploy full-stack vs backend-only, dev loop | [`docker.md`](docker.md) |
| Re-sync the bundled fastapi/shadcn skills to upstream | `../../scripts/sync-upstream.sh` (see `../../VENDOR.md`) |

---

## 📦 What you get (and what you don't)

**Wired and working:** `/health`, Scalar API docs at `/docs`, a rich startup banner, CORS, request logging, optional Bearer gate; NextAuth credentials login with first-user-becomes-admin bootstrap, MongoDB, the authenticated Next→FastAPI proxy, an app shell (sidebar + user menu), theming, and a dashboard that round-trips to the backend.

**Scaffolded but empty (for you to fill):** `app/api/routes/` (one `example` router to replace), `app/schemas/`, `app/services/`, `app/models/`.

**Deliberately NOT included:** any domain logic, real branding, or third-party integrations (LLMs, vector DBs, SSO vendors, SMTP, …). This is a *base*, not a product.

---

## 🚫 What this skill is NOT for

- A **frontend-only** Next.js app, or a Next app with a different backend. This scaffold is for a **Python backend as the main server** with an *optional* UI.
- A non-containerized / serverless setup. The whole design is "one Docker image, switchable frontend".
- Teaching FastAPI or shadcn from scratch — that's what the **bundled skills** are for; this one wires them into a deployable shape.

---

## 📚 Sub-docs

- [`backend.md`](backend.md) — `app/` layout, config/auth/database, the `main.py` banner + Scalar, where to grow
- [`frontend.md`](frontend.md) — Next structure, the NextAuth + MongoDB + proxy auth flow, env split, shadcn hand-off
- [`docker.md`](docker.md) — multi-stage build, the switchable entrypoint, compose deploy stub, dev loop, the two run modes

## 🔗 Bundled skills (vendored, MIT — see `../../VENDOR.md`)

- **`fastapi`** — official FastAPI skill (best practices + `references/`)
- **`shadcn`** — official shadcn skill (components, CLI, styling `rules/`)

---

*This skill scaffolds against the reference stack: FastAPI + `pydantic-settings` + Motor (MongoDB), Next.js 16 (App Router, standalone output) + NextAuth + Tailwind v4 + shadcn. Pinned dep versions track that stack — bump them deliberately.*
