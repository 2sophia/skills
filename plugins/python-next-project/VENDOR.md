# Vendored upstream skills

This plugin bundles two official, MIT-licensed skills so it works out of the
box. They are **snapshots** — re-sync with `./scripts/sync-upstream.sh`.

| Skill | Upstream | Ref | Commit | Synced |
|---|---|---|---|---|
| `fastapi` | https://github.com/fastapi/fastapi (`fastapi/.agents/skills/fastapi`) | `master` | `91dba4484dbd` | 2026-05-28 |
| `shadcn`  | https://github.com/shadcn-ui/ui (`skills/shadcn`) | `main` | `360e8a19c3ee` | 2026-05-28 |

Both upstreams are licensed MIT. Original copyright remains with their authors
(FastAPI: Sebastián Ramírez; shadcn/ui: shadcn). Only the files referenced by
each skill's `SKILL.md` are vendored (shadcn `agents/`, `assets/`, `evals/`
are intentionally omitted).
