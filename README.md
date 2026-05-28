# OneDNA — Semaglutide PGX Digital Form System

Full-stack implementation of the PRD v1.0. A secure, multi-step digital
requisition form for hospital-side **Users**, centrally monitored by an
**Administrator**, with real-time WebSocket notifications.

```
onedna-pgx/
├── backend/    Fastify + TypeScript + Zod + PostgreSQL + native ws
└── frontend/   Next.js 14 (App Router) + TypeScript + Tailwind + Zustand
```

## Stack (per PRD §4)

| Layer        | Technology                                              |
|--------------|---------------------------------------------------------|
| Frontend     | Next.js 14, TypeScript, Tailwind, Zustand, Recharts     |
| Backend API  | Fastify, TypeScript, Zod                                |
| Real-time    | Native WebSocket (`ws`) — Socket.io excluded            |
| Database     | PostgreSQL (Supabase)                                   |
| Auth         | JWT (access 15m + refresh 7d) in HttpOnly cookies, bcrypt |

## Prerequisites

- Node.js 20+
- A PostgreSQL database (Supabase project, or local Postgres)

## 1. Backend setup

```bash
cd backend
cp .env.example .env          # then edit secrets + DATABASE_URL
npm install
npm run seed                  # applies schema.sql + seeds the admin user
npm run dev                   # http://localhost:4000
```

`npm run seed` applies `src/db/schema.sql` and creates the admin from
`ADMIN_SEED_ID` / `ADMIN_SEED_PASSWORD`. No self-registration exists; all
hospital Users are created by the admin in the UI (PRD §4.2).

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

The frontend proxies `/api/*` and `/ws` to the backend (see `next.config.js`).

## 3. First login

1. Open http://localhost:3000 → redirects to `/login`
2. Select **Administrator**, sign in with the seeded credentials
3. Go to **User Create** → add a hospital User
4. Log out, select **Hospital User**, sign in, and fill a New Entry

## Key flows

- **Multi-step form** (`/new-entry`) — 11 sections with side-nav status,
  per-section Zod-style validation, auto-calculated BMI, auto-save every 2 min,
  Save-as-Draft, preview + consent, submit.
- **Drafts** (`/drafts`) — resume at the saved section; deleted on submit.
- **Admin dashboard** (`/admin/dashboard`) — metric cards (day/week/month/year/all),
  12-month bar chart, recent submissions; live-updates on WS events.
- **Admin data** (`/admin/data`) — submissions grouped per User, full read-only
  detail view of all 11 sections.
- **Notifications** — bell with unread count; WS pushes `FORM_SUBMITTED` to all
  connected admins within ~2s of a submission.

## API endpoints (PRD §9)

| Method | Path                              | Auth  |
|--------|-----------------------------------|-------|
| POST   | /api/auth/login                   | —     |
| POST   | /api/auth/refresh                 | rt    |
| POST   | /api/auth/logout                  | at    |
| GET    | /api/auth/me                      | at    |
| GET/POST | /api/admin/users                | admin |
| PATCH  | /api/admin/users/:id              | admin |
| GET/POST | /api/drafts                     | user  |
| GET/PATCH/DELETE | /api/drafts/:id         | user  |
| POST   | /api/submissions                  | user  |
| GET    | /api/admin/submissions            | admin |
| GET    | /api/admin/submissions/:id        | admin |
| GET    | /api/admin/submissions/stats      | admin |
| GET    | /api/admin/notifications          | admin |
| PATCH  | /api/admin/notifications/:id/read | admin |
| WS     | /ws?token=<jwt>                   | admin |

## Production notes

- **Backend** → Docker (`backend/Dockerfile`) on Digital Ocean; Nginx + TLS in front.
- **Frontend** → Vercel; set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` to the public API.
- **WebSocket auth**: this build connects same-origin through the proxy. In
  production, issue a short-lived WS ticket from an authenticated endpoint and
  pass it as `?token=` (the hub already validates the JWT on handshake).
- `bcryptjs` is used instead of native `bcrypt` for portable builds; swap back to
  `bcrypt` if you prefer native and have a build toolchain.

## Verified

- Backend: `npx tsc` clean, compiles to `dist/`.
- Frontend: `npx next build` succeeds — all 11 routes compiled & type-checked.
