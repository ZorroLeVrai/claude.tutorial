## What plugins are

Claude Code plugins are installable packages that extend the CLI — a single plugin can bundle:
- **Skills** (like the ones listed above, e.g. `anthropic-skills:deep-research`)
- **Slash commands**
- **Subagents**
- **MCP servers**
- **Hooks**

Plugins are distributed via **marketplaces** (git repos with a `.claude-plugin` manifest). Anthropic ships an official one, `claude-plugins-official`, which is registered on every machine.

## Plugins Vs MCP

**MCP (Model Context Protocol)** is a connection mechanism that links Claude to external tools and data sources. MCP servers expose:
- **Tools** — callable functions (e.g., GitHub API calls, DB queries)
- **Resources** — read-only data Claude can reference
- **Prompts** — reusable templates

They connect via HTTP, SSE, WebSocket, or stdio, configured with `claude mcp add` or `.mcp.json`. Examples: querying Postgres, integrating GitHub, reading Notion, pulling Sentry data.

**Plugins** are a packaging/distribution unit that bundles multiple components together:
- **Skills** (SKILL.md instructions)
- **Agents** (subagent definitions)
- **Hooks** (lifecycle automation)
- **Mods** (JS hooks for UI/commands)
- **MCP servers** (just one possible component)

Plugins are distributed via marketplaces, install as a single package, and update together. E.g., a code-review plugin might bundle a `/review` command, a hook that auto-runs on commits, and an MCP server for GitHub — all in one install.

**The key distinction:** MCP is narrow — it's just the wire protocol for giving Claude tool/data access. Plugins are broader — a wrapper that can *include* one or more MCP servers alongside skills, agents, and hooks, distributed as a single shareable unit.

**Rule of thumb:**
- Just need a tool/data connection → add an MCP server directly
- Want a coordinated bundle (commands + hooks + MCP + skills) shared via a marketplace → use a plugin

## How to list installed plugins**

Run:
```
claude plugin list
```

Interactively inside a Claude Code session you can also use the `/plugin` slash command, which opens a menu to browse marketplaces, install, enable/disable, or remove plugins.

`/plugin` is the built-in command for managing plugins

**Slash commands (interactive session):**
- `/plugin list` — list installed plugins
- `/plugin install <name>` — install a plugin
- `/plugin uninstall <name>` — remove one
- `/plugin marketplace add <name> <source>` — register a marketplace
- `/plugin marketplace remove <name>`
- `/plugin reload` — reload after changes

**CLI equivalents (terminal, outside a session):**
- `claude plugin list`
- `claude plugin install <plugin>@<marketplace>`
- `claude plugin uninstall <plugin>`
- `claude plugin add-marketplace <name> <source>`
- `claude plugin validate` / `claude plugin init` (scaffold a new plugin)
