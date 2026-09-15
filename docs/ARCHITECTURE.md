# Architecture Overview

## 1. System Context

**A Ray of Hope — Volunteer Management System** is structured as a decoupled client-server architecture. The backend provides a secure, stateless REST API, designed to serve a modern Next.js frontend (to be developed separately).

```mermaid
flowchart TD
    subgraph Client Layer [Frontend - Next.js (Separate)]
        AdminUI[Admin Dashboard]
        VolunteerUI[Volunteer Dashboard]
    end

    subgraph API Layer [Backend - Express + TypeScript]
        Router[Express Router]
        AuthMW[Auth & RBAC Middleware]
        Controllers[Controllers Layer]
        Services[Service / Business Logic Layer]
        Prisma[Prisma ORM Client]
    end

    subgraph Data Layer [Database - PostgreSQL]
        Neon[(PostgreSQL on Neon)]
    end

    AdminUI -->|REST API + Bearer JWT| Router
    VolunteerUI -->|REST API + Bearer JWT| Router
    Router --> AuthMW
    AuthMW --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> Neon
```

---

## 2. Layered Architecture (Backend)

The backend follows a clean, layered architectural pattern:

### 1. **Routing Layer (`src/routes/`)**
- Declares HTTP routes and maps them to respective controller methods.
- Applies endpoint-specific middlewares (JWT authentication, role guards, validation).

### 2. **Middleware Layer (`src/middlewares/`)**
- **Authentication**: Validates JWT bearer tokens in incoming `Authorization` headers.
- **Authorization (RBAC)**: Enforces role checks (`ADMIN` vs `VOLUNTEER`).
- **Validation**: Inspects request body/query parameters before reaching business logic.
- **Error Handling**: Centralized error middleware returning consistent JSON errors.

### 3. **Controller Layer (`src/controllers/`)**
- Handles HTTP request parsing and response formulation.
- Delegates business logic execution to the service layer.
- Returns standardized response envelopes (`{ success: true, data: ..., message: ... }`).

### 4. **Service Layer (`src/services/`)**
- Houses all domain rules and business logic (e.g., verifying tasks, checking hours validity, computing statistics).
- Pure logic independent of HTTP semantics (easily testable).

### 5. **Data Access Layer (`prisma/` & `src/utils/prisma.ts`)**
- Single source of truth for database schema via Prisma.
- Strongly-typed queries against PostgreSQL (Neon).

---

## 3. Technology Stack Rationale

| Layer | Choice | Rationale |
|---|---|---|
| **Runtime & Language** | Node.js + TypeScript | High performance I/O, robust type safety, shared interfaces with future Next.js frontend. |
| **Framework** | Express.js | Minimalistic, flexible, battle-tested, clean middleware pipeline. |
| **ORM** | Prisma | Schema-first workflow, type-safe query building, seamless migrations with PostgreSQL. |
| **Database** | PostgreSQL (Neon) | ACID compliant, reliable relational model, connection pooling, hosted on cloud. |
| **Auth** | JWT + bcrypt | Stateless authentication suitable for decoupled frontend/backend setup. |

---

## 4. Cross-Cutting Concerns

- **CORS**: Configured to allow requests from the frontend development & production origins with credential support.
- **Environment Configuration**: Centralized config using `dotenv` with validation on startup.
- **Logging**: Request logging for development and error tracking.
- **Error Handling**: Custom error class hierarchy (`AppError`, `NotFoundError`, `UnauthorizedError`, `ValidationError`).
