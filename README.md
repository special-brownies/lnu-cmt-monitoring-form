# LNU CMT Monitoring System

## Project Description
LNU CMT Monitoring System is a web-based properties and equipment monitoring platform for the LNU CMT Office.

The system supports:
- Equipment tracking and assignment
- Maintenance scheduling and user maintenance requests
- Role-based access control (`SUPER_ADMIN`, `USER`)
- Analytics dashboard and operational metrics
- Equipment timeline tracking (status/location/maintenance events)
- User profile and profile picture management
- Session timeout and browser-session auth validation

## Feature List

### Admin Features
- Equipment Management (create, edit, delete, filter, sort)
- Category Management (create, edit, delete with usage checks)
- Room Management
- User Management
- Maintenance Scheduling and completion
- Analytics Dashboard
- Activity Timeline / Recent Activity
- Dashboard Quick Actions
- Collapsible, responsive dashboard sidebar

### User Features
- User Dashboard (role-aware quick actions)
- Assigned Equipment View only
- Maintenance Requests (restricted to assigned equipment)
- Profile Management (via User Management profile view)
- Profile Picture Upload with crop
- Session timeout enforcement and startup auth validation

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

### Backend
- NestJS
- Prisma ORM
- PostgreSQL

### Dev Environment
- Docker
- Docker Compose

## Project Structure
- `apps/api` -> NestJS backend
- `apps/web` -> Next.js frontend
- `apps/api/prisma` -> Prisma schema, migrations, seed script
- `docker-compose.yml` -> container orchestration (`lnu_postgres`, `lnu_api`, `lnu_web`)

## How To Run (Docker-First)

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- Git

### Steps
1. Clone the repository.
2. Go to the project root.
3. Copy `.env.example` to `.env` (optional if defaults are acceptable).
4. Run:

```bash
docker compose up --build
```

The stack will automatically:
- Start PostgreSQL
- Build and start API + Web containers
- Run Prisma migrations
- Seed initial data only when the database is empty

Optional helper commands:

```bash
docker compose down
docker compose down -v
npm run docker:db:reseed
```

### Access URLs
- Frontend: `http://localhost:3001`
- API: `http://localhost:3000`
- API Health: `http://localhost:3000/health`

### Default Seed Credentials
- Admin: `debug1772286374@lnu.local` / `DebugPass123`
- Faculty sample: `FAC-1001` / `Faculty123`

## Environment Variables

Use root `.env` for Docker Compose overrides.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `POSTGRES_USER` | No | `lnu` | PostgreSQL username |
| `POSTGRES_PASSWORD` | No | `lnu123` | PostgreSQL password |
| `POSTGRES_DB` | No | `lnu_assets` | PostgreSQL database name |
| `POSTGRES_PORT` | No | `5432` | Host port for PostgreSQL |
| `API_PORT` | No | `3000` | Host port for API |
| `WEB_PORT` | No | `3001` | Host port for Web |
| `JWT_SECRET` | Yes (prod) | `replace_with_long_random_secret` | JWT signing secret |
| `NEXT_PUBLIC_API_URL` | No | `/api` | Browser-facing API URL (proxied by Next.js) |
| `INTERNAL_API_URL` | No | `http://lnu_api:3000` | Container-internal API URL for Next.js rewrites |
| `NEXT_PUBLIC_SESSION_TIMEOUT_MS` | No | `1800000` | Session timeout (ms) |

For API-only local runs, see `apps/api/.env.example`.

## Operational Notes
- Database safety:
  - PostgreSQL data persists in Docker volume `postgres_data`.
  - Startup uses `prisma migrate deploy` (safe, non-destructive).
  - Seed runs conditionally and is skipped when data already exists.
  - No automatic `prisma migrate reset` or forced reseed on container start.
- Frontend/API connectivity:
  - Browser requests use `/api/*` on the web origin.
  - Next.js rewrites `/api/*` to `INTERNAL_API_URL` (default `http://lnu_api:3000`) inside Docker.
- Authentication/session behavior:
  - Token validation runs on startup and route navigation.
  - Inactivity timeout is controlled by `NEXT_PUBLIC_SESSION_TIMEOUT_MS` (default `30` minutes).
  - Browser-session lifecycle checks clear stale auth state when a new browser session is detected.
- Manual reseed (development only):
  - Run `npm run docker:db:reseed` while containers are running.
  - Alternative local command: `npm run db:reseed` from repo root.
- Navigation behavior:
  - Sidebar collapse state is persisted.
  - Sidebar auto-collapses on narrow viewports and keeps animated width transitions.
- API enforces role and ownership checks (not only frontend UI restrictions).
- Users can only view assigned equipment and request maintenance for assigned equipment.
- Admin-only endpoints remain protected by JWT + role guards.

## Screenshots (Optional)
Add screenshots here if available:
- Dashboard
- Equipment Management
- Maintenance Page
- Analytics

## License
License to be defined.
