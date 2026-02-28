# LNU CMT Monitoring System

## Overview
LNU CMT Monitoring System is a full-stack asset monitoring platform for the LNU Computer Maintenance Technologist (CMT) Office. It centralizes equipment records, faculty assignments, status/location history, and account workflows in a Dockerized architecture designed for maintainability and operational readiness.

## Features
- Asset tracking for institutional equipment (create, update, assign, retire-ready lifecycle)
- Faculty equipment assignment and ownership visibility
- Dashboard-ready data flows for monitoring and operational analytics
- Role-based access control for `SUPER_ADMIN` and `USER` actors
- Helpdesk-style password request workflow for faculty users
- Audit-ready architecture via structured history models and admin action traceability

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | NestJS, Prisma ORM, JWT (Passport) |
| Database | PostgreSQL |
| Infrastructure | Docker, Docker Compose |

## System Architecture
The system uses a containerized, service-oriented architecture:

`Next.js Web (3001)` → `NestJS API (3000)` → `PostgreSQL (5432)`

### Docker Services
- `web`: Next.js frontend container
- `api`: NestJS backend container
- `postgres`: PostgreSQL database container
- `cli`: utility container for workspace commands

### Runtime Networking
- Internal container DNS is used for inter-service communication (for example `postgres` and `api`).
- Browser-facing endpoints are exposed through localhost ports.

## Authentication Model

### Account Sources
- `User` table: `SUPER_ADMIN` accounts
- `Faculty` table: `USER` accounts

### Login Methods
- `SUPER_ADMIN` login: email + password
- `USER` (faculty) login: employeeId + password

### Password Request Workflow
1. Faculty submits a password request using employee ID.
2. API always returns a generic success response (prevents account enumeration).
3. `SUPER_ADMIN` reviews pending requests.
4. `SUPER_ADMIN` resolves request by setting a new faculty password.
5. Request is marked `COMPLETED` with resolver tracking.

## Getting Started

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)

### Installation
```bash
docker compose up --build
```

### Service Ports
- Frontend: `http://localhost:3001`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

### Database Commands
Run commands inside Docker:

```bash
# Apply migrations
docker compose exec api npx prisma migrate deploy

# Seed database
docker compose exec api npx ts-node prisma/seed.ts

# Regenerate Prisma client (if schema changed)
docker compose exec api npx prisma generate
```

## Default Credentials

### SUPER_ADMIN
- Email: `debug1772286374@lnu.local`
- Password: `DebugPass123`

### Sample Faculty
- Employee ID: `FAC-1001`
- Password: `FacultyPass123`

## Project Structure
```text
apps/
  api/
    prisma/
      schema.prisma
      migrations/
      seed.ts
    src/
      auth/
      prisma/
      modules/
        user/
        faculty/
        equipment/
        category/
        room/
        status-history/
        location-history/
        password-requests/

  web/
    src/
      app/
        login/
        forgot-password/
        (dashboard)/
      components/
        auth/
        ui/
      lib/
    public/
```

## API Overview
Base URL: `http://localhost:3000`

### Authentication
- `POST /auth/login/admin`
- `POST /auth/login/faculty`

### Password Requests
- `POST /password-requests`
- `GET /password-requests` (SUPER_ADMIN only)
- `POST /password-requests/:id/resolve` (SUPER_ADMIN only)

### Core Modules (Protected)
- `/users`
- `/faculty`
- `/equipment`
- `/categories`
- `/rooms`
- `/status-history`
- `/location-history`

## Development Workflow
1. Pull latest code and rebuild containers if dependencies changed.
2. Update Prisma schema when changing data models.
3. Generate and apply migrations.
4. Reseed local database when needed.
5. Implement backend module changes first (DTO → Service → Controller).
6. Integrate frontend pages/components with API and auth guards.
7. Validate with containerized build checks.

Typical commands:

```bash
# Start stack
docker compose up --build

# Backend build check
docker compose exec api npm run build

# Frontend build check
docker compose exec web npm run build
```

## Security Notes
- Passwords are hashed using `bcrypt`.
- JWT is required for protected endpoints.
- Role checks enforce SUPER_ADMIN-only operations (account creation, password request management).
- Faculty password request endpoint avoids exposing account existence.
- Password request resolution is traceable through resolver metadata.

## Roadmap
- Email notifications for password request lifecycle
- Reporting and export module for assets and utilization
- Multi-factor authentication (MFA) for SUPER_ADMIN accounts

## License
License to be defined.
