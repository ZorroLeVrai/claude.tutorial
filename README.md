# Claude Best Practices

A personal reference and tutorial for working with Claude and Claude Code: the main features, practical tips, and ready-to-reuse example files for starting a new project.

## Contents

| File | Description |
|---|---|
| [Claude_introduction.md](Claude_introduction.md) | Overview of Claude Code: prompting rules, the framework for building an application, `CLAUDE.md`, MCP, skills, checkpointing, sub agents, plugins, commands, context and costs |
| [Claude_Build_from_scratch.md](Claude_Build_from_scratch.md) | Step-by-step recipe to build a project from scratch (scope, tech stack, implementation plan, scaffolding, context7, memory file) |
| [Authentication.md](Authentication.md) | Managed vs custom authentication, sessions vs JWT, and related concepts |
| [Tips.md](Tips.md) | Engineering questions to ask yourself before and while building |
| [For_starting_a_project_example/](For_starting_a_project_example/) | A complete set of example project documents (see below) |

## Main Claude Code features covered

- **Prompting rules**: be clear and specific, give context, break features down, keep tests up to date, say what *not* to do
- **Project memory** (`CLAUDE.md`): persistent instructions and context for a project
- **Model Context Protocol (MCP)**: connecting Claude to external tools and documentation (e.g. context7)
- **Skills**: reusable packaged instructions
- **Checkpointing**: rewinding changes made during a session
- **Sub agents**: delegating tasks to specialised agents
- **Plugins**: bundling and sharing extensions
- **Commands, context and costs**: the main slash commands and how to keep usage under control

See [Claude_introduction.md](Claude_introduction.md) for the details.

## Recommended workflow for a new project

1. Write a `project-scope.md` (title, problem, solution, features) and ask Claude to review it and ask clarifying questions
2. Define the MVP
3. Ask Claude to suggest a tech stack, refine it, and save it to `tech-stack.md`
4. Ask Claude to create an `implementation-plan.md` split into small tasks grouped by phase
5. Scaffold the project, using context7 for up-to-date library documentation
6. Generate the `CLAUDE.md` memory file

The full walkthrough is in [Claude_Build_from_scratch.md](Claude_Build_from_scratch.md).

## Example files

[For_starting_a_project_example/](For_starting_a_project_example/) contains the documents produced by that workflow for an example project, an AI-powered ticket management system:

- [project-scope.md](For_starting_a_project_example/project-scope.md): problem, solution, features, statuses and categories
- [tech-stack.md](For_starting_a_project_example/tech-stack.md): frontend, backend and architecture choices
- [implementation-plan.md](For_starting_a_project_example/implementation-plan.md): phased checklist of tasks
- [CLAUDE.md](For_starting_a_project_example/CLAUDE.md): project memory file referencing the other documents

Copy them into a new project and adapt them to your own needs.

## Usage

This is a documentation-only repository. Browse the Markdown files directly, or open the folder in VS Code and read them in the preview.
