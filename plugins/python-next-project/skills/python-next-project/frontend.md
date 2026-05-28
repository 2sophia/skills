# Frontend — Next.js (App Router) + NextAuth + shadcn

The frontend is **optional at runtime** (see [`docker.md`](docker.md)) but fully
wired in the scaffold: auth, an app shell, and a dashboard that round-trips to
the backend. For UI work (adding/composing components, styling), follow the
bundled **`shadcn`** skill — this doc covers the scaffold's structure and the
auth/proxy plumbing, which shadcn does not.

## Layout

```
frontend/
├── proxy.ts                         # Next 16 middleware (was middleware.ts): NextAuth gate
├── app/
│   ├── layout.tsx                   # root: SessionWrapper + ThemeProvider + Toaster
│   ├── globals.css                  # Tailwind v4 + shadcn tokens (neutral)
│   ├── (app)/                       # auth-gated route group
│   │   ├── layout.tsx               # shell: sidebar + header(user-menu)
│   │   └── page.tsx                 # dashboard — calls /api/example via the proxy
│   ├── auth/page.tsx                # login page (public)
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── backend/[...path]/route.ts    # authenticated proxy → FastAPI
│       └── version/route.ts              # public build-info probe
├── lib/
│   ├── auth.ts                      # NextAuth: Credentials + bcrypt + first-admin bootstrap
│   ├── mongodb.ts                   # MongoClient singleton (HMR-safe)
│   ├── api.ts                       # api.get/post/... → /api/backend/*
│   └── utils.ts                     # cn() (shadcn)
├── components/
│   ├── session-wrapper.tsx          # <SessionProvider>
│   ├── theme-provider.tsx           # next-themes
│   ├── sidebar.tsx · user-menu.tsx · app-logo.tsx
│   ├── auth/login-form.tsx          # credentials form
│   └── ui/                          # shadcn primitives — ADDED via the shadcn CLI
├── components.json                  # shadcn config (style new-york, neutral, lucide)
└── next.config.ts                   # output:"standalone" + /health rewrite
```

> `components/ui/` is **not** shipped. Run `npx shadcn@latest add button input label card sonner` (the scaffold's components import these) — see the **`shadcn`** skill.

## The auth flow (end to end)

1. **Gate** — `proxy.ts` (`withAuth`) redirects unauthenticated requests to `/auth`. Its `matcher` excludes `auth`, `api/auth`, `api/version`, static assets, `favicon`, `health`, and `*.svg`. (In Next 16 the middleware file is `proxy.ts`; older Next calls it `middleware.ts`.)
2. **Login** — `/auth` renders `login-form.tsx` → `signIn("credentials", …)`.
3. **NextAuth** — `lib/auth.ts` `authorize()` checks the password (bcrypt) against Mongo. **First-admin bootstrap:** if no users exist, the first sign-in creates the owner (`role: "admin"`). Set `BOOTSTRAP_ADMIN_EMAIL` to lock that to one address (recommended on a public deploy). A unique index on `email` closes the concurrent-bootstrap race. JWT session; `id`/`role`/`isSuperAdmin` flow into the token + session.
4. **Calling the backend** — client code uses `lib/api.ts` (`api.get("/example")`) → hits `/api/backend/example`. The proxy (`app/api/backend/[...path]/route.ts`) reads the server-side session, rejects with 401 if absent, then forwards to `${FASTAPI_URL}/api/example` injecting **`x-user-id`** (and `Authorization: Bearer ${BACKEND_API_KEY}` if set). **The browser never reaches FastAPI directly** — this route is the authz boundary.

## Env (frontend side, un-prefixed — server-side only)

| Var | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | JWT signing — **must set in prod** |
| `NEXTAUTH_URL` | external URL of the app |
| `MONGODB_URI` | Mongo for NextAuth (can equal the backend's) |
| `AUTH_DB` | auth database name |
| `FASTAPI_URL` | backend URL the proxy forwards to |
| `BACKEND_API_KEY` | optional Bearer forwarded to the backend (must match `APP_API_KEY`) |
| `BOOTSTRAP_ADMIN_EMAIL` | optional — restrict first-admin to one email |

## Adding an OAuth/SSO provider

`lib/auth.ts` is credentials-only with a commented hook. next-auth ships many providers — uncomment the example, gate it on its env var, and mirror the bootstrap/deny logic. Keep it vendor-neutral in the scaffold.

## Build note

`next.config.ts` sets `output: "standalone"` so the Docker image runs `node server.js` without `node_modules`. Don't remove it — the image build + `--frontend` entrypoint depend on it.
