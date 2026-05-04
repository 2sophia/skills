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
| **`sophia-motor`** | How to use the [`sophia-motor`](https://github.com/2sophia/motor) Python library: `@tool` decorator, `MotorConfig`, `RunTask`, subagents, in-process MCP, structured output, multi-turn chat, audit dump, security guardrail. | [`skills/sophia-motor/`](./skills/sophia-motor/) |

## Repository layout

```
.claude-plugin/
├── marketplace.json    ← read by `/plugin marketplace add 2sophia/skills`
└── plugin.json         ← single-plugin metadata (oggi only sophia-motor)
skills/
└── <skill-name>/       ← one folder per skill, each with its own SKILL.md
README.md
LICENSE
```

When future skills land (e.g. `rgci`, `sophia-agent`), they get their own folder under `skills/` and their own entry in `marketplace.json`.

## Update / uninstall

```
/plugin update sophia-motor
/plugin uninstall sophia-motor
```

## Versioning

Each skill tracks the version of the upstream library it documents — `sophia-motor@0.5.1` means the skill content was built against `sophia-motor==0.5.1` Python package. When the installed Python version differs, the skill instructs Claude to inspect the installed source for ground truth.

## Contributing a skill

PRs welcome. Each new skill needs:
- `skills/<name>/SKILL.md` with frontmatter (`name`, `description`)
- An entry in `.claude-plugin/marketplace.json`
- A row in this README's "Available skills" table

## License

MIT — see [LICENSE](./LICENSE).

---

*Pattern follows the Anthropic Claude Code marketplace convention. Inspired by [`qdrant/skills`](https://github.com/qdrant/skills).*
