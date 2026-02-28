# LNU CMT Monitoring System

## Overview
LNU CMT Monitoring System is an asset tracking platform for managing institutional equipment, category metadata, faculty ownership, room assignments, and status history. The backend is built for containerized deployment and exposes REST APIs for operational monitoring workflows.

## Tech Stack
- Frontend: React (separate app workspace)
- Backend: NestJS + Prisma ORM
- Database: PostgreSQL
- Authentication: JWT (Passport JWT strategy)
- Infrastructure: Docker + Docker Compose

## Features
- Equipment tracking and lifecycle updates
- Faculty assignment management
- Room/location assignment history
- Equipment status monitoring history
- JWT authentication for protected APIs

## Architecture
The system runs as Docker services:
- `postgres`: PostgreSQL database container
- `api`: NestJS backend container on port `3000`
- `cli`: utility container for workspace tooling

Backend services connect over Docker network using service DNS (for example, `postgres` in `DATABASE_URL`).

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Installation
```bash
docker compose up --build
```
Note: restart containers after any `.env` or `NEXT_PUBLIC_*` environment changes.

### Run Migrations
```bash
docker compose exec api npx prisma migrate dev
```

### Seed Data
```bash
docker compose exec api npx prisma db seed
```

## API Documentation

### Base URL
```text
http://localhost:3000
```

### Auth Endpoints
- `POST /auth/register` - create an admin user with hashed password
- `POST /auth/login` - authenticate and receive JWT access token

### Core Endpoints
- `GET|POST|PATCH|PUT|DELETE /categories`
- `GET|POST|PATCH|PUT|DELETE /faculty`
- `GET|POST|PATCH|PUT|DELETE /rooms`
- `GET|POST|PATCH|PUT|DELETE /equipment`
- `POST /status-history`
- `GET /status-history/equipment/:equipmentId`
- `POST /location-history`
- `GET /location-history/equipment/:equipmentId`

## Authentication Flow
1. Call `POST /auth/login` with credentials.
2. Receive:
```json
{
  "access_token": "<JWT>"
}
```
3. Send token to protected routes:
```http
Authorization: Bearer <JWT>
```

## Folder Structure
```text
apps/
  api/
    prisma/
      schema.prisma
      migrations/
    src/
      auth/
      prisma/
      modules/
        category/
        faculty/
        room/
        equipment/
        status-history/
        location-history/
        user/
```

## Future Improvements
- Role-based access control (RBAC)
- Audit logs for all critical mutations
- Reporting dashboards and export pipelines
