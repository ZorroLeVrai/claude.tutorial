**4. Subagents** — useful when a task would flood your main context: e.g. delegate "write tests for this whole module" to a subagent so the verbose file-reading/exploration doesn't clutter your main conversation, and it reports back just a summary. Not worth it for quick, iterative single-file work — subagents start with fresh context and add latency.

## Custom Agents vs. `/btw`

### Creating an Agent
Agents live as markdown files in `.claude/agents/` (project) or `~/.claude/agents/` (user-level), with YAML frontmatter:

```yaml
---
name: code-reviewer
description: Reviews code changes for bugs and best practices
tools: Read, Grep, Bash
model: sonnet
---

You are a code review specialist...
```

Key fields: `name`, `description` (tells Claude when to delegate to it), `tools` (allow-list to restrict capabilities), `model` (sonnet/opus/haiku), optional `permissionMode` and `effort`.

You manage these via the `/agents` command (terminal-only — not available in this session), or just drop the file in manually. Once defined, an agent is **reusable**: it runs in its own isolated context with its own system prompt and tool restrictions, and can be invoked repeatedly across tasks/conversations.

### `/btw`
`/btw` is for a quick side question **without leaving your current conversation**:
- Read-only — no tools, can't run code or touch files
- The answer appears in a temporary overlay and never joins the conversation history
- Reuses the parent conversation's prompt cache, so it's cheap
- Nothing persists afterward

### The core difference
- **Agent** = a persistent, named, reusable specialist with its own prompt and toolset — built once, invoked many times, does real work (reads files, edits, runs commands).
- **`/btw`** = a disposable, no-tools side question for quick recall/clarification that doesn't pollute or affect your main task context.

Use an agent when you want a repeatable delegate with capabilities; use `/btw` when you just want a fast answer without derailing what you're doing.

## Use case

You've just finished writing a feature and have a local diff. Instead of asking the main session to review it (which burns its context on reading every file and reasoning about style/bugs), you delegate: *"Use the code_reviewer agent to check my changes before I open a PR."* It runs in an isolated context, reads the diff, applies whatever review criteria its system prompt specifies, and comes back with findings — without bloating your main conversation's token budget.

## How to invoke it

- **Automatic delegation**: the main model matches your request against the agent's `description` field and decides to spawn it on its own — fuzzy, not guaranteed.
- **Explicit invocation**: you name it directly — e.g. "use the code_reviewer agent" or `@code_reviewer` — which forces that specific definition to run rather than leaving it to automatic matching.
- There's no dedicated `/agent <name>` slash command for spawning it mid-conversation. Separately, `claude --agent code_reviewer` is a different thing: it launches a whole CLI session *as* that agent from the start, rather than spawning it as a sub-task within an existing session.

## What comes back to the parent session

- Only the **final text report** the subagent chooses to return — not its intermediate tool calls, reads, or reasoning. The parent session's context stays clean regardless of how much work the subagent did internally.
- Its `tools` restriction in the frontmatter caps what it's allowed to do (e.g. `Read, Grep, Bash` but no `Edit` — good for a reviewer that should only observe, not modify).
- If the subagent writes files to disk, those writes persist on the filesystem independent of its summary — but the parent session won't automatically know about them unless the summary mentions them or you check the files yourself.
- Trust-but-verify applies: the agent's summary describes what it *says* it did, not a guarantee — worth spot-checking its claims against actual file state for anything consequential.
- 