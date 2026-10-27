**2. Hooks** — high value for exactly your workflow, because they're deterministic (run regardless of what the model decides):
- `PostToolUse` matching `Edit|Write` → auto-run your formatter/linter after every code change
- `PostToolUse` or a `Stop` hook → run your test suite automatically and feed failures back to Claude
- `PreToolUse` → block edits to protected files (`.env`, lockfiles)

These go in `.claude/settings.json` (shareable) as shell commands triggered on specific events.

## What a hook is

A hook is a shell command that Claude Code itself runs at a specific moment of its lifecycle. Unlike an instruction in CLAUDE.md (which the model may or may not follow), a hook **always runs**. That makes hooks the right tool for anything that must be guaranteed: formatting, blocking dangerous actions, running tests, notifications.

How it works:

1. An event fires (e.g. Claude is about to run a tool).
2. If the event's `matcher` matches (usually the tool name), your command is started.
3. The command receives a **JSON description of the event on stdin** (tool name, tool input, working dir, session id...).
4. Its **exit code** decides what happens:
   - `0` → no objection, carry on (stdout/JSON can add context)
   - `2` → **block**; whatever you wrote to stderr is sent back to Claude as feedback so it can correct itself
   - other → non-blocking error, shown to you only

## Main hook events

| Event | Fires when | Typical use |
|---|---|---|
| `SessionStart` | A session starts or resumes | Inject context (git status, current ticket), set env vars |
| `UserPromptSubmit` | You submit a prompt, before Claude sees it | Add context, validate or reject prompts |
| `PreToolUse` | Before a tool call runs | Block or approve a call, protect files, validate commands |
| `PermissionRequest` | A permission dialog is about to show | Auto-allow/deny on your own logic |
| `PostToolUse` | After a tool call succeeded | Format, lint, run tests, log |
| `PostToolUseFailure` | After a tool call failed | Log/diagnose failures |
| `Notification` | Claude needs your attention (waiting for input/permission) | Desktop/sound notification |
| `SubagentStart` / `SubagentStop` | A subagent starts / finishes | Setup/cleanup for a subagent |
| `Stop` | Claude finishes its answer | Run the test suite, force Claude to continue if checks fail |
| `PreCompact` | Before the context is compacted | Save state you don't want to lose |
| `SessionEnd` | The session ends | Cleanup, final logging |

The list evolves with versions: check `/hooks` in Claude Code (it lists the events available in your version and the hooks currently configured) or the hooks reference at code.claude.com/docs/en/hooks.

### Matchers: which tools?

The `matcher` filters by **tool name** on tool events. The tools you will use most:

| Tool | What it does |
|---|---|
| `Edit` | Modifies part of an existing file |
| `Write` | Creates or overwrites a whole file |
| `Bash` | Runs a shell command |
| `Read`, `Glob`, `Grep` | Read/search files |
| `mcp__<server>__<tool>` | A tool from an MCP server |

Matchers accept a single name (`Bash`), alternatives (`Edit|Write`), or a regex; omit it (or `*`) to match everything. To filter on the arguments too, add an `if` field such as `"if": "Bash(git *)"` (only on tool events).

## PreToolUse vs PostToolUse: use cases

**PreToolUse** — runs *before* the action, so it can **prevent** it (exit code 2, or a JSON permission decision):
- Protect sensitive files: refuse any `Edit`/`Write` on `.env`, lockfiles, `migrations/`, generated code
- Block dangerous shell commands (`rm -rf`, `drop table`, `git push --force`)
- Enforce a policy (only allow `git` commands that match your workflow)
- Rewrite or validate input before it runs

**PostToolUse** — runs *after* the action succeeded, so it cannot undo it but can **react** to it:
- Auto-format / lint the file that was just changed (Prettier, ESLint, Black...)
- Run the related tests and feed failures back to Claude (exit 2 + stderr)
- Log what changed, update an index, regenerate docs

Rule of thumb: *"must never happen"* → PreToolUse; *"must always happen afterwards"* → PostToolUse. For "when Claude thinks it's done, check everything" → `Stop`.

## Example: PreToolUse, block edits to protected files

`.claude/hooks/protect-files.sh`:

```bash
#!/bin/bash
INPUT=$(cat)                                          # JSON event on stdin
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

for PROTECTED in ".env" "package-lock.json" "pnpm-lock.yaml"; do
  if [[ "$FILE" == *"$PROTECTED" ]]; then
    echo "Blocked: $FILE is protected, ask the user first." >&2   # stderr -> Claude's feedback
    exit 2                                                       # 2 = block
  fi
done

exit 0   # no objection, normal permission flow continues
```

Configuration:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh" }
        ]
      }
    ]
  }
}
```

Claude tries to edit `.env` → the call is cancelled, Claude receives the message and explains/asks instead.

## Example: PostToolUse, format after every edit

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

After each successful `Edit` or `Write`, the file path is extracted from the stdin JSON and passed to Prettier. Variation: run `npm test` in the hook and, on failure, print the output to stderr and `exit 2` so Claude sees the failing tests and fixes them.

Notes: these examples need `jq` (or use a Node/Python/PowerShell script that parses the JSON instead). On Windows, hook commands run through your shell, so prefer a script you have tested there.

## Where to write the hooks: project or `~/.claude`?

Both work; the **file you choose decides the scope**:

| File | Applies to | Shared with team? |
|---|---|---|
| `~/.claude/settings.json` | **All your projects** | No (your machine) |
| `.claude/settings.json` (in the project) | **This project only** | Yes, commit it |
| `.claude/settings.local.json` (in the project) | This project only | No (gitignored) |
| Managed policy settings | Whole organisation | Admin-deployed, can't be removed |

Hooks from all these files are **merged, not replaced**: a project hook and a user hook both run. Practical split:

- **Project** `.claude/settings.json`: hooks tied to the repo's tooling (that project's formatter, test command, protected files), so every teammate gets them.
- **User** `~/.claude/settings.json`: personal hooks you want everywhere (desktop notification when Claude waits for you, command logging).
- Put hook scripts in `.claude/hooks/` of the project (reference them with `$CLAUDE_PROJECT_DIR`) or in `~/.claude/hooks/` for user-level ones.

Manage and inspect them with the `/hooks` command. Changes to settings files are picked up through that menu or on the next session, so restart if a new hook doesn't seem to fire.

## Avoid destructive commands

in `.claude/settings.json`

For Windows you can use Powershell to block dangerous commands

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "shell": "powershell",
            "command": "& \"$env:CLAUDE_PROJECT_DIR\\.claude\\hooks\\block-destructive.ps1\""
          }
        ]
      }
    ]
  }
}
```

Another example where I ame using a Python script to block dangerous command

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "python .claude/hooks/block_dangerous.py" }
        ]
      }
    ]
  }
}
```

**Notes:**
- **Interpreter on Windows.** The command is looked up on your `PATH`. Use `python`, `py`, or `python3`, whichever works in your shell. You can also give a full path.
- **Script location.** The command runs from the project directory. Use `"$CLAUDE_PROJECT_DIR"/.claude/hooks/...` if you need a path that doesn't depend on the working directory.
- **Output options.** Instead of `exit 2`, you can exit 0 and print JSON to stdout, for example `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "..."}}`. This gives finer control, including `"ask"` to prompt the user rather than block.
- **Speed.** Python starts slower than Bash (tens of milliseconds), which doesn't matter for this use. Use `python -I` or `uv run` if you want isolation or dependencies.
- **Other languages.** Node, PowerShell, or a compiled binary also work. Anything that reads stdin and sets an exit code is fine.

## Permissions Vs PreToolUse

Please note that `permissions.ask` only takes tool-pattern strings (`"Bash(rm:*)"` etc.), not scripts. For scripted allow/deny/ask logic you need a **`PreToolUse` hook**, which is a separate top-level key in `settings.json`.

### How it works

**settings.json** — add a `hooks` block alongside `permissions`:

```json
{
  "permissions": {
    "ask": [ "Bash(rm:*)", "Bash(git push:*)", "..." ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "python \"%USERPROFILE%\\.claude\\hooks\\bash_decision.py\"", "timeout": 10 }
        ]
      }
    ]
  }
}
```

(On Windows, call `python script.py` explicitly in `command`)

**What the script gets**: a JSON object on **stdin** with `tool_name`, `tool_input` (e.g. `tool_input.command` for Bash), `cwd`, etc.

Please note that `tool_name` on stdin is exactly what `matcher` is matched against (string/regex, case-sensitive, exact match for built-ins). No surprises there.

**MCP tools** are the one wrinkle: their `tool_name` is `mcp__<server>__<tool>` (e.g. `mcp__memory__create_entities`), so you match them with a regex like `"mcp__.*"` rather than a literal name.

**What it must return**: JSON on **stdout**:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow" | "deny" | "ask",
    "permissionDecisionReason": "why"
  }
}
```

Plus exit code `0`. (Exit code `2` also blocks the call, using stderr as the reason, without needing JSON — but the JSON form is clearer and what you'd use for `allow`/`ask` too.)

Minimal Python example:

```python
#!/usr/bin/env python3
import json, sys

data = json.load(sys.stdin)
command = data.get("tool_input", {}).get("command", "")

def decide(decision, reason):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            "permissionDecisionReason": reason
        }
    }))
    sys.exit(0)

if "rm -rf" in command:
    decide("deny", "Destructive rm -rf blocked by policy")
elif command.startswith("git push"):
    decide("ask", "Push requires explicit approval")
else:
    sys.exit(0)  # no decision -> falls through to normal permissions.ask/allow/deny rules
```

### Key points
- `permissions.*` and `hooks.PreToolUse` are independent layers. Hooks run first and can override what `permissions` would otherwise decide (a hook can `allow` something `permissions.ask` would've prompted for, or `deny` something `permissions.allow` would've let through).
- If your script exits 0 with no JSON (or doesn't recognize the command), control falls through to the normal `permissions` evaluation — so you can keep your existing `ask` list as the fallback and only special-case things in the script.
- Field names (`hookSpecificOutput`, `permissionDecision`, `permissionDecisionReason`) are case-sensitive and exact.

### Windows security-relevant tools beyond Bash/PowerShell

| Tool | Why it matters |
|---|---|
| `Write`, `Edit` | Can create/modify files — drop scripts, backdoor configs, tamper with code |
| `NotebookEdit` | Executes code via notebook cells — same risk class as Bash |
| `WebFetch` | Arbitrary outbound HTTP — the main data-exfiltration path if you're sandboxing |
| `WebSearch` | Lower risk, but can leak query content externally |
| `Task` (the subagent-spawning tool — may show as `Agent` depending on client/version) | Spawns a subagent that itself calls tools |
| `mcp__.*` | Any MCP server tool — treat as unknown-risk unless you've vetted the server, since these can shell out, hit the filesystem, or call the network just as freely as built-ins |

**The one gap people actually miss**: `PreToolUse` hooks defined in `settings.json` apply to tool calls made *by subagents too*, not just the top-level conversation — so you don't need a separate matcher just to "catch" subagent activity. But it does mean if your hook script makes decisions based on something in top-level `cwd`/session state, double check it behaves correctly when invoked from inside a subagent's context.

Practical matcher for a Windows-hardened setup:
```json
"matcher": "Bash|PowerShell|Write|Edit|NotebookEdit|WebFetch|Task|mcp__.*"
```
Leave `Read`/`Glob`/`Grep` out unless you're worried about reconnaissance specifically — they're read-only and rarely worth the friction of routing through a script.

One caveat: tool names can shift slightly between Claude Code CLI versions/SDKs (e.g. whether the subagent tool is named `Task` or `Agent`). Worth doing a quick sanity check — log the first few `tool_name` values your hook script actually receives — rather than trusting the name list blindly.

## How to list hooks yourself going forward

Since this session's terminal-dialog commands aren't available here, from a regular interactive `claude` terminal you can run:

- **`/hooks`** — opens the interactive hook management UI, shows every configured hook grouped by event (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `SessionStart`, `SessionEnd`), lets you add/edit/remove them.
- **Manual inspection** — hooks can live in any of these files (checked in this precedence order):
  - `~/.claude/settings.json` (global/user)
  - `.claude/settings.json` (project, shared/checked-in)
  - `.claude/settings.local.json` (project, local-only)
  - Plugin-provided `hooks/hooks.json` files (only active if the plugin is enabled)

## Commands

Use the `/permissions` command to list all deny, ask, allow rules
