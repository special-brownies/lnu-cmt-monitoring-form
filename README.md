# LNU CMT Monitoring System

## Project Description
LNU CMT Monitoring System is a web-based properties and asset monitoring system for the LNU CMT Office. It provides role-based authentication (`SUPER_ADMIN` and `USER`), equipment and user management, password request handling, timeline tracking for equipment status/location changes, and responsive management tools with sorting, filtering, and polished animations. The project is built with a Docker-first development workflow for consistent local setup.

## Latest Features
- Role-based user creation flow with Admin/User selection.
- User role filter in User Management.
- Equipment Management with predefined categories and structured `Other` support.
- Equipment timeline tracking for status and location history changes.
- Global sort options across key screens: `A-Z`, `Newest`, `Oldest`.
- Icon-based action buttons for management tables.
- Global animation system (loading, tabs, dropdowns, modals, transitions, hovers).
- Improved UI/UX stability across toolbar and table layouts.
- Navbar collapse behavior improvements for better responsive navigation.

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- lucide-react

### Backend
- NestJS
- Prisma ORM
- PostgreSQL

### Dev Environment
- Docker
- Docker Compose

## System Architecture
`Next.js Web (3001)` -> `NestJS API (3000)` -> `PostgreSQL (5432)`

Docker services:
- `web`: Next.js frontend container
- `api`: NestJS backend container
- `postgres`: PostgreSQL database container
- `cli`: utility workspace container

## How To Run

### A) Prerequisites
- Node.js `20+` (required for local non-Docker runs)
- npm `10+` (recommended)
- Docker Desktop or Docker Engine + Docker Compose
- PostgreSQL `16+` (only for non-Docker database setup)

### B) Environment Setup
Create environment files before running:

1. API environment (`apps/api/.env`)
```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db_name>?schema=public
JWT_SECRET=<your_jwt_secret>
```

2. Web environment (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
INTERNAL_API_URL=http://localhost:3000
```

Notes:
- `apps/web/.env.example` is available as a reference.
- Keep secrets out of Git and use local-only values.

### C) Run With Docker (Recommended)
1. Build and start all services:
```bash
docker compose up --build
```
2. Open services:
- Frontend: `http://localhost:3001`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
3. Optional maintenance commands:
```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx ts-node prisma/seed.ts
docker compose exec api npx prisma generate
```

### D) Run Without Docker
1. Start PostgreSQL locally and prepare `apps/api/.env`.
2. Install dependencies:
```bash
cd apps/api && npm install
cd ../web && npm install
```
3. Apply migrations and seed:
```bash
cd apps/api
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```
4. Start API:
```bash
cd apps/api
npm run start:dev
```
5. Start Web (new terminal):
```bash
cd apps/web
npm run dev
```
6. Open:
- Frontend: `http://localhost:3000` (Next.js default)
- API: `http://localhost:3000` (set API port in your local setup if both run on same host/port)

## Project Structure
- `apps/api` -> NestJS backend (modules, auth, Prisma integration)
- `apps/web` -> Next.js frontend (App Router + UI)
- `apps/api/prisma` -> Prisma schema, migrations, and seed script
- `docker-compose.yml` -> local multi-service container orchestration

## Development Principles
- Docker-first workflow for consistent team environments.
- Backend-driven UI behavior and validation.
- Role-aware system design (`SUPER_ADMIN` and `USER`).
- Production-ready structure with clear module boundaries.
- Incremental development with safe, testable feature delivery.

## Authentication Model
- `SUPER_ADMIN` account source: `User` table (email + password login)
- `USER` account source: `Faculty` table (employeeId + password login)
- Password request flow is resolved by `SUPER_ADMIN` and tracked in request records.

## API Highlights
Base URL: `http://localhost:3000`

- `POST /auth/login/admin`
- `POST /auth/login/faculty`
- `POST /password-requests`
- `GET /password-requests` (`SUPER_ADMIN`)
- `POST /password-requests/:id/resolve` (`SUPER_ADMIN`)
- `PATCH /users/:id` (`SUPER_ADMIN`)
- `DELETE /users/:id` (`SUPER_ADMIN`)
- `GET /equipment?search=&status=&categoryId=`
- `POST /equipment` and `PATCH /equipment/:id` support `customCategoryName` when category is `Other`

## Default Seed Credentials
- `SUPER_ADMIN`: `debug1772286374@lnu.local` / `DebugPass123`
- Sample faculty: `FAC-1001` / `Faculty123`

## Security Notes
- Passwords are hashed with `bcrypt`.
- JWT protects secured endpoints.
- Role checks enforce admin-only operations where required.
- Password request submission avoids account enumeration.
- Inactive accounts are blocked during auth checks.

## License
License to be defined.
