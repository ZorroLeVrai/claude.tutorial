**What plugins are**

Claude Code plugins are installable packages that extend the CLI — a single plugin can bundle:
- **Skills** (like the ones listed above, e.g. `anthropic-skills:deep-research`)
- **Slash commands**
- **Subagents**
- **MCP servers**
- **Hooks**

Plugins are distributed via **marketplaces** (git repos with a `.claude-plugin` manifest). Anthropic ships an official one, `claude-plugins-official`, which is registered on every machine.

**How to list installed plugins**

Run:
```
claude plugin list
```

Interactively inside a Claude Code session you can also use the `/plugin` slash command, which opens a menu to browse marketplaces, install, enable/disable, or remove plugins.
