**1. CLAUDE.md** — do this first. Run `/init` to auto-generate one from your codebase. Keep it under ~200 lines: build/test commands, where tests and docs live, naming conventions. Use `.claude/rules/*.md` with `paths:` frontmatter if you want rules to only load for specific file types (e.g. a `testing.md` rule that only loads when Claude touches `*.test.ts`).

## Generating a CLAUDE.md with `/init`

1. Open Claude Code at the root of the project and run `/init`.
2. Claude explores the codebase (build files, test setup, folder layout, existing conventions) and writes a `CLAUDE.md` at the root.
3. **Review and edit the result.** It is a starting point: delete anything generic or obvious, and add what Claude couldn't guess (team conventions, gotchas).
4. Commit it so the whole team shares it. Re-run `/init` on an existing file and Claude proposes improvements rather than starting from zero.

Alternative: type `#`-style quick additions or ask "add this to CLAUDE.md" during a session when you catch yourself repeating an instruction.

## Rules for writing a good CLAUDE.md

- **Short and specific.** Target under ~200 lines. The whole file is loaded into context every session, so every line costs tokens and dilutes the others.
- **Concrete and verifiable.** "Run `npm test -- --coverage` before committing" beats "make sure tests pass". "Use 2-space indentation" beats "format code nicely".
- **Structured.** Markdown headings and bullets; Claude scans them like you do.
- **Consistent.** Contradicting instructions (in the same file or across files) lead to arbitrary behaviour. Review periodically and prune.
- **Imperative and actionable.** Write instructions, not documentation.

### What to add

- Build, test, lint and run commands (the exact ones)
- Where things live: tests, docs, generated code, entry points
- Code style and naming conventions that differ from the language defaults
- Architecture decisions Claude can't infer from reading a single file
- Workflow rules: branch naming, commit message format, PR checklist
- Non-obvious gotchas: "tests need a local Redis", "never edit `generated/`"

### What NOT to add

- Anything Claude can read from the code itself (file-by-file descriptions, obvious structure)
- Standard language/framework conventions it already knows
- Long tutorials, API docs or full style guides (link to them or import them instead)
- Information that changes often (it goes stale and misleads)
- Secrets, tokens, credentials (the file is usually committed)
- Vague advice ("write clean code", "be careful")
- Rules that must be *enforced* with 100% certainty: use a [hook](Hooks.md) or a permission rule instead, CLAUDE.md is guidance, not a guarantee

## Multiple CLAUDE.md files, and how they are loaded

Yes, several can coexist. They are **all loaded and combined (concatenated)**, not replaced one by another:

| Location | Scope | Shared? |
|---|---|---|
| Managed policy CLAUDE.md (OS-specific system path) | Whole organisation, cannot be excluded | Admin-deployed |
| `~/.claude/CLAUDE.md` | You, in every project | No |
| `./CLAUDE.md` or `./.claude/CLAUDE.md` | This project | Yes (git) |
| `./CLAUDE.local.md` | This project, personal | No (gitignored) |
| `CLAUDE.md` in **parent** directories | Loaded at launch when you start Claude below them (handy for monorepos) | Depends |
| `CLAUDE.md` in **subdirectories** | Loaded **on demand**, only when Claude reads files in that subtree | Yes (git) |

### Order and priority

- Broader scopes (managed, user) are loaded first, then the project files; the more specific, closer-to-the-work file appears later and so is naturally the one Claude weighs most.
- There is **no hard override mechanism**: the files are added to context together. If two files give **conflicting** instructions, Claude may follow either, so avoid conflicts rather than relying on precedence (the docs say this explicitly for user-level vs project-level rules).
- Subdirectory files don't cost anything at startup; they only kick in when work happens in that folder.
- To skip files you don't want (e.g. another team's in a big monorepo), use `claudeMdExcludes` in settings (managed-policy files can't be excluded):
  ```json
  { "claudeMdExcludes": ["**/vendor/**/CLAUDE.md"] }
  ```
- Use `@path/to/file` **imports** inside a CLAUDE.md to pull in other files (e.g. `@README.md`, `@docs/git-workflow.md`) without copy-pasting. Example reusing a shared AGENTS.md:
  ```markdown
  @AGENTS.md

  ## Claude Code
  Use plan mode for changes under `src/billing/`.
  ```

## Rule files (`.claude/rules/*.md`)

### What they are for

Rule files split a growing CLAUDE.md into **small, topic-focused markdown files**. They're discovered recursively in `.claude/rules/` (subfolders like `frontend/` or `backend/` are fine), and personal ones can live in `~/.claude/rules/` to apply to every project (loaded before project rules).

There are two kinds:

| Kind | Frontmatter | When loaded |
|---|---|---|
| Unconditional | none | At launch, same priority as `.claude/CLAUDE.md` |
| **Path-scoped** | `paths:` globs | Only when Claude works with files matching the globs |

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All API endpoints must include input validation
- Use the standard error response format
- Include OpenAPI documentation comments
```

### When to use them

- CLAUDE.md is getting long (approaching ~200 lines) and mixes unrelated topics
- A convention only matters for certain files (tests, API layer, migrations, docs): scope it with `paths:` so it doesn't consume context the rest of the time
- Several people own different areas and you want separate files (less merge conflict than one big CLAUDE.md)
- You want personal rules across all projects (`~/.claude/rules/`)

Keep in mind they're still *guidance*: if something must be guaranteed, use a hook.

### Use-case example: a web app with API, tests and docs

Project layout:

```text
my-app/
├── CLAUDE.md                  # short: build/test commands, repo map, commit format
└── .claude/
    └── rules/
        ├── code-style.md      # no paths: always loaded (naming, imports)
        ├── testing.md         # paths: ["**/*.test.ts", "tests/**"]
        ├── api.md             # paths: ["src/api/**/*.ts"]
        └── docs.md            # paths: ["docs/**/*.md", "README.md"]
```

`.claude/rules/testing.md`:

```markdown
---
paths:
  - "**/*.test.ts"
  - "tests/**"
---

# Testing conventions

- Use Jest with the Arrange / Act / Assert structure, one behaviour per test
- Name tests "should <expected behaviour> when <condition>"
- Mock external HTTP with `msw`, never hit real services
- Run a single file with `npm test -- <path>` before running the full suite
```

What happens:

- You ask Claude to add an endpoint in `src/api/users.ts`: `api.md` loads (validation, error format), `testing.md` and `docs.md` stay out of context.
- Claude then writes `users.test.ts`: `testing.md` loads and the Arrange/Act/Assert + msw conventions apply.
- You ask it to update the README: only `docs.md` loads.

Result: the always-on CLAUDE.md stays tiny, and each task only pays for the rules that are relevant to it.
