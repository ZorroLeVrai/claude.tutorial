# Ticket Manager

## Project Overview

A ticket management system that uses AI to classify, respond to, and route support tickets. See `project-scope.md` for full requirements and `implementation-plan.md` for phased task breakdown.

## Architecture

Two separate projects:

- `frontend/` — React SPA (Vite, React Router v7, TypeScript, Tailwind CSS)
- `backend/` — Express REST API (Bun, TypeScript, Prisma, PostgreSQL)

Session cookie issued by the backend; frontend sends it on every request via `credentials: "include"`.

See `tech-stack.md` for the full stack breakdown.

## Development

```bash
# Start server
cd server && bun run dev

# Start client
cd client && bun run dev
```

The client proxies `/api/*` requests to the server via Vite config (target is configurable via `VITE_API_URL` env var, defaults to `http://localhost:3000`).

## Documentation

- Use Bun as the runtime and package manager (not npm/yarn).
- Use Typescript throughout.
- When working with a library, framework, SDK, API, or CLI tool (React, Express, Prisma, Vite, Tailwind, etc.), use `context7` to fetch up-to-date documentation.
