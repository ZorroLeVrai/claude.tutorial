# Tech Stack

## Frontend

| Concern | Choice |
|---|---|
| Framework | React 19 |
| Routing | React Router v7 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| HTTP Client | Fetch |
| Build tool | Vite |

## Backend

| Concern | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | Database sessions (express-session + connect-pg-simple) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Email ingestion | SendGrid or Mailgun for outbound replies and inbound webhooks |

## Architecture

Two separate projects:

- `frontend/` — React SPA served by Vite dev server (dev) / static host (prod)
- `backend/` — Express REST API consumed by the frontend

Session cookie issued by the backend; frontend sends it on every request via `credentials: "include"`.

## Hosting (suggested)

| Layer | Option |
|---|---|
| Frontend | Vercel / Netlify (static) |
| Backend | Railway / Render |
| Database | Neon / Supabase (hosted PostgreSQL) |
