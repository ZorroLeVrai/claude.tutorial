There are some security tooling that can make your claude usage more secure.

## Maintenance — who's behind each

| | Maintainer | Distribution |
|---|---|---|
| **`claude-security`** | **Anthropic** (author: Anthropic, support@anthropic.com) | Official `claude-plugins-official` marketplace |
| **`security-guidance`** | **Anthropic employee** | Official `claude-plugins-official` marketplace |
| **`hookify`** | **Anthropic** (author: Anthropic, support@anthropic.com) | Official `claude-plugins-official` marketplace |
| **Prismor** | Independent open-source project/author (not Anthropic) | Standalone pip package, cross-agent |

So yes — `claude-security` and `security-guidance` are Anthropic-maintained, bundled directly in the official plugin marketplace. Prismor is a third-party tool that happens to integrate with Claude Code (and Cursor, Codex, etc.) via hooks, but Anthropic has no hand in building or vetting it.

## What they actually do differently

- **`claude-security`** — on-demand **vulnerability scanner**: you invoke `/claude-security`, it deep-scans *your code* for vulnerabilities (SAST-style), challenges its own findings, then proposes patches you approve. It's not a runtime gatekeeper — it doesn't stop Claude mid-action.
- **`security-guidance`** — **passive reviewer**: fires on every `Edit`/`Write`/`Bash(git commit/push)`/session `Stop`, runs pattern checks + an LLM review of the diff, and surfaces warnings. Also reactive, not preventive — it tells you *after* something happened, it doesn't block the action from happening.
- **`hookify`** — **DIY rule engine**: not a security scanner per se, but a way to write your own guardrails without touching `hooks.json`. You describe a behavior to prevent (`/hookify Block rm -rf`, or just `/hookify` to mine the conversation for things you've corrected), and it writes a rule file `.claude/hookify.<name>.local.md`. Rules are read dynamically, so they apply on the very next tool use (no restart). See the [hookify plugin](#hookify-plugin) section at the end.
- **`Prismor`** — **runtime gatekeeper**: intercepts *every* tool call (not just git/edit events) **before** it executes and can actually **block** it (allow/warn/block verdicts), covering shell commands, secret leakage, prompt injection, package installs, MCP calls.

The key architectural difference: the Anthropic plugins review code *quality/vulnerabilities you're writing*. Prismor polices *what the agent itself is doing/executing in your environment*. They're not really substitutes — they solve different threat models. `hookify` sits in between: it's the same preventive mechanism as Prismor (PreToolUse blocking), but with **only the rules you write yourself** and no built-in security knowledge.

## Pros / Cons

**Anthropic plugins (`claude-security`, `security-guidance`)**
- ✅ Maintained by Anthropic, tightly integrated, no extra install/runtime (Python venv via `ensure_agent_sdk.py`), trusted supply chain
- ✅ Good at catching vulnerabilities *in the code Claude writes* (XSS, SSRF, hardcoded secrets, injection, etc.)
- ❌ Advisory only — can't stop Claude from running a destructive/leaky command in the moment; by the time `security-guidance` reacts (`PostToolUse`/`Stop`), the Bash command already ran
- ❌ `security-guidance` adds LLM calls on every edit/commit — latency + token cost
- ❌ Doesn't cover cross-agent use (if you also use Cursor/Codex, you configure security twice)

**Prismor**
- ✅ Actually **preventive** — can block a dangerous command/leak before execution, not just flag it afterward
- ✅ Single policy across multiple agents (Claude Code, Cursor, Codex, Copilot...) if you use more than one
- ✅ Starts in observe-only mode, so you can tune policy before enforcing
- ❌ Not Anthropic-built — you're trusting a third-party's hook scripts with visibility into (and the power to block) everything your agent does; supply-chain risk is real (there's a known PoC exploit reference for it, per earlier search)
- ❌ Extra dependency to install/update (`pip install prismor`) and keep patched
- ❌ Newer/smaller project — less scrutiny and track record than an Anthropic-shipped plugin

## hookify plugin

`hookify` is an Anthropic plugin that lets you create your own guardrails with plain markdown files instead of hand-editing `hooks.json`. Each guardrail is a *hookify rule*.

### Installation

```text
/plugin marketplace add anthropics/claude-plugins-official   # only if the marketplace isn't already registered
/plugin install hookify@claude-plugins-official
```

Restart the session afterwards so the plugin's hooks are loaded. Requirement: `python3` must be on the PATH (the hook scripts are Python; on Windows it's often missing by default).

Under the hood the plugin registers four generic hooks — `PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit` (10s timeout each). On every event they read all `.claude/hookify.*.local.md` files of the project and check whether a rule matches. Nothing is enabled out of the box: with no rule file, hookify does nothing.

### What is a hookify rule?

A rule is a markdown file named `.claude/hookify.<rule-name>.local.md`:
- the **YAML frontmatter** says *when* to trigger and *what to do*
- the **body** is the message shown to Claude when the rule fires

```markdown
---
name: block-dangerous-rm
enabled: true
event: bash          # bash | file | stop | prompt | all
pattern: rm\s+-rf    # Python regex
action: block        # warn (default) | block
---

Dangerous rm command detected! Verify the path and make sure you have backups.
```

| Field | Meaning |
|---|---|
| `name` | Unique identifier of the rule |
| `enabled` | `true` / `false`, turn a rule on or off without deleting it |
| `event` | `bash` (Bash commands), `file` (Edit/Write/MultiEdit), `stop` (Claude tries to finish), `prompt` (user prompt submission), `all` |
| `pattern` | Python regex matched against the command / file content / prompt |
| `action` | `warn` (default): show the message but let the operation through. `block`: prevent the tool call (PreToolUse) or stop the session (Stop events) |
| `conditions` | Optional, replaces `pattern` for finer matching: a list of `field` / `operator` / `pattern` (e.g. `file_path` + `regex_match` + `\.env$\|credentials`). **All conditions must match** |

The plugin's `examples/` folder has ready-made rules: `dangerous-rm`, `console-log-warning`, `sensitive-files-warning`, `require-tests-stop`.

### Configuration

There are three ways to create a rule:

1. **From an instruction**: `/hookify Block git push --force` — Claude writes the rule file for you.
2. **From the conversation**: `/hookify` with no argument — the `conversation-analyzer` agent looks at what you recently corrected or got frustrated by and proposes rules.
3. **By hand**: create `.claude/hookify.my-rule.local.md` yourself.

Then manage them with:

| Command | Purpose |
|---|---|
| `/hookify:list` | List configured rules |
| `/hookify:configure` | Enable/disable rules interactively |
| `/hookify:help` | Built-in help |

Notes:
- Rules are re-read on every event, so a new or edited rule applies on the **very next tool use** (no restart).
- Rules live in the project's `.claude/` folder, so they're per project. `*.local.md` files are meant to be git-ignored; commit them only if you want to share them with the team.
- To disable a rule: `enabled: false` or delete the file.

### Use case: blocking a dangerous command

**Scenario**: you let Claude work autonomously on a repo and want to be sure it can never rewrite the shared history. A `git push --force` to `main` would overwrite your teammates' commits, and once it's pushed it's hard to undo. A *warning* isn't enough here since you may not be watching, so the rule must **block**.

**1. Create the rule** (`/hookify Block git push --force`, or write the file by hand):

`.claude/hookify.block-force-push.local.md`
```markdown
---
name: block-force-push
enabled: true
event: bash
pattern: git\s+push\s+.*(--force|\s-f\b)
action: block
---

Force-push blocked by a hookify rule.

Rewriting remote history is not allowed in this project. Push normally; if the push is
rejected, rebase or merge the remote changes first. If a force-push is really needed, ask the user to run it manually.
```

**2. Test it**: ask Claude `Run git push --force origin main`.

**3. What happens**: the `PreToolUse` hook sees a Bash command matching the regex and, because `action: block`, the command is **never executed**. Claude receives the rule's message instead, and so knows *why* it was refused and what to do instead (here, rebase/merge or ask you). With `action: warn` the command would have run anyway.

Limits to keep in mind:
- The pattern also matches `--force-with-lease` (it starts with `--force`). Tighten the regex if you want to allow the safer variant.
- Regex matching is syntactic: it can't catch the same effect through another route (e.g. `git push origin +main`, a shell script, or an alias). Treat the rule as a seat belt for the common cases, not a security boundary.

### Pros / Cons

- ✅ Anthropic-maintained, no extra runtime beyond `python3`, no LLM calls (plain regex → no token cost, negligible latency)
- ✅ Genuinely **preventive** with `action: block`, unlike `security-guidance` / `claude-security`
- ✅ Rules are plain, reviewable markdown; easy to turn a "never do that again" moment into a permanent guardrail
- ❌ Only as good as your regexes: easy to bypass (`rm -fr`, `rm -r -f`, variable indirection, scripts that call `rm`), no semantic understanding
- ❌ Nothing ships enabled: you start with zero protection until you write rules
- ❌ Project-scoped and Claude-Code-only, so no cross-agent policy like Prismor
