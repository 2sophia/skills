#!/usr/bin/env bash
# Re-vendors the official upstream skills bundled with this plugin:
#   • FastAPI  — github.com/fastapi/fastapi  (MIT)
#   • shadcn   — github.com/shadcn-ui/ui     (MIT)
#
# We ship a snapshot so the plugin is self-contained (no separate install
# needed). This script re-pulls the upstream sources and refreshes VENDOR.md
# with the resolved commit shas. Run it from anywhere; it cd's to the plugin
# root. Override the refs to pin a specific tag/commit:
#   FASTAPI_REF=0.115.0 SHADCN_REF=main ./scripts/sync-upstream.sh
set -euo pipefail
cd "$(dirname "$0")/.."

FASTAPI_REF="${FASTAPI_REF:-master}"
SHADCN_REF="${SHADCN_REF:-main}"

FASTAPI_BASE="https://raw.githubusercontent.com/fastapi/fastapi/${FASTAPI_REF}/fastapi/.agents/skills/fastapi"
SHADCN_BASE="https://raw.githubusercontent.com/shadcn-ui/ui/${SHADCN_REF}/skills/shadcn"

fetch() {  # url  dest
  mkdir -p "$(dirname "$2")"
  curl -fsSL "$1" -o "$2"
  echo "  ✓ $2"
}

echo "→ FastAPI skill (ref: ${FASTAPI_REF})"
fetch "$FASTAPI_BASE/SKILL.md"                   skills/fastapi/SKILL.md
fetch "$FASTAPI_BASE/references/dependencies.md" skills/fastapi/references/dependencies.md
fetch "$FASTAPI_BASE/references/other-tools.md"  skills/fastapi/references/other-tools.md
fetch "$FASTAPI_BASE/references/streaming.md"    skills/fastapi/references/streaming.md

echo "→ shadcn skill (ref: ${SHADCN_REF})"
fetch "$SHADCN_BASE/SKILL.md"         skills/shadcn/SKILL.md
fetch "$SHADCN_BASE/cli.md"           skills/shadcn/cli.md
fetch "$SHADCN_BASE/customization.md" skills/shadcn/customization.md
fetch "$SHADCN_BASE/mcp.md"           skills/shadcn/mcp.md
for r in styling forms composition base-vs-radix icons; do
  fetch "$SHADCN_BASE/rules/$r.md" "skills/shadcn/rules/$r.md"
done

# Resolve the upstream commit shas for provenance (best-effort; needs gh auth).
fa_sha=$(gh api "repos/fastapi/fastapi/commits/${FASTAPI_REF}" --jq '.sha' 2>/dev/null | cut -c1-12 || echo "unknown")
sh_sha=$(gh api "repos/shadcn-ui/ui/commits/${SHADCN_REF}"   --jq '.sha' 2>/dev/null | cut -c1-12 || echo "unknown")
today=$(date +%Y-%m-%d)

cat > VENDOR.md <<EOF
# Vendored upstream skills

This plugin bundles two official, MIT-licensed skills so it works out of the
box. They are **snapshots** — re-sync with \`./scripts/sync-upstream.sh\`.

| Skill | Upstream | Ref | Commit | Synced |
|---|---|---|---|---|
| \`fastapi\` | https://github.com/fastapi/fastapi (\`fastapi/.agents/skills/fastapi\`) | \`${FASTAPI_REF}\` | \`${fa_sha}\` | ${today} |
| \`shadcn\`  | https://github.com/shadcn-ui/ui (\`skills/shadcn\`) | \`${SHADCN_REF}\` | \`${sh_sha}\` | ${today} |

Both upstreams are licensed MIT. Original copyright remains with their authors
(FastAPI: Sebastián Ramírez; shadcn/ui: shadcn). Only the files referenced by
each skill's \`SKILL.md\` are vendored (shadcn \`agents/\`, \`assets/\`, \`evals/\`
are intentionally omitted).
EOF
echo "✓ VENDOR.md updated (fastapi=${fa_sha}, shadcn=${sh_sha}, ${today})"
echo "done."
