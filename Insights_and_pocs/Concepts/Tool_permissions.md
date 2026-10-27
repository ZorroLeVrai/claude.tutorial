## Tool permissions model

Two layers work together:

**1. Permission modes** (cycle with `Shift+Tab`, or set via `--permission-mode` / `defaultMode` in settings):
| Mode | Behavior |
|---|---|
| `default` (Manual) | Asks before almost everything except reads |
| `acceptEdits` | Auto-accepts file edits + safe filesystem commands (`mkdir`, `mv`...) in your working dir |
| `plan` | Read-only exploration, blocks edits until you approve a plan |
| `auto` | A separate classifier model reviews risky actions instead of prompting you (blocks things like `curl \| bash`, force-pushes, secret commits; allows local file ops, declared deps, same-repo pushes) |
| `dontAsk` | Auto-denies anything that would otherwise need a prompt — good for locked-down CI |
| `bypassPermissions` | No checks at all — containers/VMs only |

**2. Permission rules** — `allow`/`ask`/`deny` lists in a settings file, evaluated in that order (deny wins over ask wins over allow, regardless of specificity):
```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Edit(src/**/*.ts)"],
    "deny": ["Bash(git push *)"]
  }
}
```
Rules are `Tool` or `Tool(specifier)` — a Bash command prefix, a file glob, an MCP server pattern, etc. Where you put the file controls scope:

| File | Scope |
|---|---|
| `~/.claude/settings.json` | All your projects |
| `.claude/settings.json` | This project, shareable via git |
| `.claude/settings.local.json` | This project, gitignored, personal |
| Managed policy (admin) | Org-wide, can't be overridden |

For your use case (local code/test/doc gen), the practical move is pre-approving your test/build/lint commands in `.claude/settings.json` so you're not interrupted on every `npm test`.
