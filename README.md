# Sophia AI — Claude Code skills

Curated [Claude Code](https://docs.claude.com/en/docs/claude-code/) skills + plugins maintained by [Sophia AI](https://2sophia.ai). One repo, multiple skills, single marketplace endpoint.

## Install

Inside a Claude Code session:

```
/plugin marketplace add 2sophia/skills
/plugin install <skill-name>
```

## Available skills

| Skill | What it teaches | Source |
|---|---|---|
| **`sophia-motor`** | How to use the [`sophia-motor`](https://github.com/2sophia/motor) Python library: `@tool` decorator, `MotorConfig`, `RunTask`, subagents, in-process MCP, structured output, multi-turn chat, audit dump, security guardrail. | [`plugins/sophia-motor/`](./plugins/sophia-motor/) |
| **`python-next-project`** | How to scaffold a production-grade, Docker-containerized app with a Python backend and a Next.js frontend: project layout, multi-stage Dockerfiles, compose, env/secrets, and the gold-standard conventions. | [`plugins/python-next-project/`](./plugins/python-next-project/) |

## Repository layout

```
.claude-plugin/
└── marketplace.json              ← marketplace index, read by `/plugin marketplace add 2sophia/skills`
plugins/                          ← one folder per plugin (set as `pluginRoot` in marketplace.json)
├── sophia-motor/
│   ├── .claude-plugin/plugin.json
│   └── skills/sophia-motor/      ← SKILL.md + sub-docs
└── python-next-project/
    ├── .claude-plugin/plugin.json
    └── skills/python-next-project/
README.md
LICENSE
```

Each plugin is independently installable. When future plugins land (e.g. `rgci`, `sophia-agent`), they get their own folder under `plugins/` and their own entry in `marketplace.json`.

## Update / uninstall

```
/plugin update sophia-motor
/plugin uninstall sophia-motor
```

## Versioning

Each skill tracks the version of the upstream library it documents — `sophia-motor@0.5.1` means the skill content was built against `sophia-motor==0.5.1` Python package. When the installed Python version differs, the skill instructs Claude to inspect the installed source for ground truth.

## Contributing a skill

PRs welcome. Each new plugin needs:
- A folder `plugins/<name>/` with `.claude-plugin/plugin.json` (minimal: `{ "name": "<name>" }`)
- One or more skills at `plugins/<name>/skills/<skill>/SKILL.md` with frontmatter (`name`, `description`)
- An entry in the `plugins[]` array of `.claude-plugin/marketplace.json` (with `pluginRoot` set, `source` is just the folder name)
- A row in this README's "Available skills" table

## License

MIT — see [LICENSE](./LICENSE).

---

*Pattern follows the Anthropic Claude Code marketplace convention. Inspired by [`qdrant/skills`](https://github.com/qdrant/skills).*
