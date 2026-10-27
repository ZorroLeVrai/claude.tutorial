### Phase 1 — Permissions & daily workflow basics (~30 min)
The thing you'll touch every single session.
- Learn the modes: `default` (manual), `acceptEdits`, `plan`, `auto`. Practice cycling them with `Shift+Tab`.
- Pick a default for yourself — likely `acceptEdits` while coding, `plan` when you want Claude to scope something risky before touching files.
- Run `/permissions` once to see the dialog and understand allow/ask/deny.
- **Exercise**: add one `allow` rule to `.claude/settings.json` for your test command (e.g. `"Bash(npm test *)"`) so you stop getting prompted for it.

### Phase 2 — CLAUDE.md (~30–45 min)
Your most-used persistence mechanism — write this before anything else.
- Run `/init` in your project to auto-generate a starting CLAUDE.md.
- Edit it down to: build/test commands, where tests live, doc conventions, naming rules. Keep it under ~200 lines.
- Learn `.claude/rules/*.md` with `paths:` frontmatter for conventions that should only load for certain files (e.g. a `testing.md` rule scoped to `**/*.test.ts`).
- **Exercise**: write a CLAUDE.md section describing exactly how you want unit tests structured (framework, assertion style, file naming) — this is the highest-leverage thing for your "generate unit tests" use case.

### Phase 3 — Auto memory (~15 min)
Passive, but worth understanding so it doesn't surprise you.
- Run `/memory` to see what Claude has already saved about you.
- Understand the distinction: CLAUDE.md = you write it, auto memory = Claude writes it from your corrections.
- No real "exercise" here — just correct Claude naturally in conversation ("no, we use pnpm not npm") and check later that it stuck.

### Phase 4 — Hooks (~1–2 hours)
Biggest payoff for your workflow because they're deterministic, not best-effort.
- Learn the event model: `PreToolUse`, `PostToolUse`, `Stop`.
- **Exercise 1**: a `PostToolUse` hook matching `Edit|Write` that runs your linter/formatter automatically after every code change.
- **Exercise 2**: a `Stop` hook (or agent-based hook) that runs your test suite before Claude considers a task done, and feeds failures back.
- Optional: a `PreToolUse` hook that blocks edits to `.env` / lockfiles.

### Phase 5 — Skills (~1–2 hours)
For scaffolding you repeat often.
- Learn the `SKILL.md` frontmatter format, where skills live (`.claude/skills/<name>/`), and that they load on demand (cheaper than CLAUDE.md).
- **Exercise**: turn your "generate a unit test for this function" routine into a skill — this is likely your single best time investment given your use case.
- Later: a second skill for "update docs for this changed module" if you find yourself re-explaining the doc format repeatedly.

### Phase 6 — Subagents (~1 hour, situational)
Learn it, use it only when context gets noisy.
- Understand: subagents run in isolated context, so a big exploratory task (e.g. "write tests for this entire module") doesn't flood your main conversation with file reads.
- **Exercise**: create a `test-generator` subagent in `.claude/agents/` and delegate a multi-file test-writing task to it, compare the experience to doing it inline.
- Know when *not* to use it: quick single-file edits, anything needing back-and-forth iteration.

### Phase 7 — MCP servers, consuming (~30 min, optional)
Skip unless a concrete need shows up (e.g. you want Claude reading GitHub issues or Figma specs). Just know `claude mcp add` exists and how scoping (`local`/`project`/`user`) works.

### Phase 8 — Writing your own MCP server (personal knowledge, no immediate need)
Not required for your workflow — local code/test/doc generation doesn't need custom integrations. Learn this last, for its own sake:
- Read the protocol fundamentals at [modelcontextprotocol.io/docs/develop/build-server](https://modelcontextprotocol.io/docs/develop/build-server).
- Try the official scaffolding plugin: `/plugin install mcp-server-dev@claude-plugins-official` then `/mcp-server-dev:build-mcp-server`.
- **Exercise** (toy project, not tied to your real workflow): build a trivial local stdio MCP server — e.g. one tool that queries a dummy SQLite file — just to understand the request/response lifecycle (tools, resources, transports).

---

**Suggested pacing**: Phases 1–2 in your next session (immediate payoff), Phase 4 within your first week (biggest ROI for test/doc automation), Phases 5–6 as you notice repetition, Phases 7–8 whenever curiosity strikes — no deadline pressure since they're not blocking your actual work.