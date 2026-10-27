## Memory beyond CLAUDE.md

Yes — **auto memory** is a separate, real mechanism (not something I was unsure about after checking). Claude Code has two complementary systems, both loaded every session:

| | CLAUDE.md | Auto memory |
|---|---|---|
| Who writes it | You | Claude, automatically |
| Contains | Rules/instructions | Learnings from your corrections, preferences, project context |
| Stored at | wherever you put the file | `~/.claude/projects/<project>/memory/` |

Auto memory saves four kinds of notes (`user`, `feedback`, `project`, `reference`) and skips anything derivable from the code — it's for things like "this user prefers pnpm" or "tests need local Redis." Toggle it with `/memory`, browse/edit the files directly (plain markdown). It's on by default locally.

So: CLAUDE.md = what *you* want Claude to always know. Auto memory = what *Claude* has learned without you writing it down.
