# A Ray of Hope — Volunteer Management System (`ray-of-hope-volunteer-hub`)

## Project Context & Mission
"A Ray of Hope — Volunteer Management System" is a Service Learning web application built for the **A Ray of Hope Foundation** (an NGO).
The platform enables NGO administrators to manage volunteers, create and assign tasks, and verify volunteer service hours. Volunteers can track their assigned tasks, log completed hours with completion notes, and submit tasks for administrative review.

## Key Technical Decisions
- **Backend**: Node.js, Express, TypeScript, REST API
- **Database**: PostgreSQL (hosted on Neon), Prisma ORM (*No SQLite*)
- **Authentication**: JWT (JSON Web Tokens), `bcrypt` (salt rounds = 10), Role-Based Access Control (`ADMIN`, `VOLUNTEER`)
- **Frontend (Separate / Future)**: Next.js, TypeScript, Tailwind CSS, 21st.dev components (communicates via REST API)
- **External Services**: PostgreSQL on Neon (no external APIs)

## Critical Business Rules
1. **Dynamic Verified Service Hours (Single Source of Truth)**:
   - Official volunteer service hours accrue **ONLY** from approved task submissions:
     `SUM(approvedHours) WHERE volunteerId = [volunteer] AND reviewStatus = 'APPROVED'`
   - There is NO duplicate `totalApprovedHours` stored on the User record.
   - When a task is marked `SUBMITTED`, the logged hours do NOT count toward official hours.
   - Only when an Admin explicitly reviews and approves (`reviewStatus = 'APPROVED'`, `Task.status = 'APPROVED'`) do the approved hours count.
2. **Volunteer Identifier**: Volunteers log in using a unique Volunteer ID (e.g., `ARH-VOL-001`) or email and password.
3. **Simplified Task Lifecycle**:
   - `ASSIGNED` -> `SUBMITTED` -> `APPROVED` (Counts hours) OR `REJECTED` (Feedback given, volunteer can resubmit).

## Implemented Authentication & RBAC (Milestone 2)
- `POST /api/auth/login`: Admin (`email` + `password`), Volunteer (`volunteerId` or `email` + `password`).
- `GET /api/auth/me`: Safe authenticated user profile (excludes `passwordHash`).
- `authenticate` middleware (`src/middlewares/auth.middleware.ts`): Bearer token parsing and JWT verification.
- `requireRole`, `requireAdmin`, `requireVolunteer` (`src/middlewares/role.middleware.ts`): RBAC enforcement.
- Seed script (`prisma/seed.ts`): Pre-configured development test accounts (`admin@rayofhope.org` / `Admin@123`, `ARH-VOL-001` / `Volunteer@123`).

## Implemented Volunteer Management / Admin CRUD (Milestone 3)
- `POST /api/admin/volunteers`: Admin creates volunteer with auto-generated sequential `volunteerId` (`ARH-VOL-001`), bcrypt-hashed password, unique email validation, and collision retry handling.
- `GET /api/admin/volunteers`: Admin lists volunteers with pagination (`page`, `limit`), search (`name`, `volunteerId`, `email`), and status filtering (`ACTIVE`, `INACTIVE`).
- `GET /api/admin/volunteers/:id`: Admin views single volunteer profile by UUID.
- `PATCH /api/admin/volunteers/:id/status`: Admin activates/deactivates a volunteer. Prevents modification of Admin accounts. Hard delete is disabled.
- Protection: `authenticate` + `requireAdmin` on all `/api/admin/volunteers/*` endpoints.

## Implemented Task Management (Milestone 4)
- `POST /api/admin/tasks`: Admin creates and assigns a task to an active volunteer. Initial status is `ASSIGNED`. Validates dates, expected hours > 0, and active volunteer role. `createdById` derived from authenticated admin.
- `GET /api/admin/tasks`: Admin lists all tasks with status filtering, volunteer filtering (`assignedToId`), search (`title`/`description`), and pagination.
- `GET /api/admin/tasks/:id`: Admin retrieves single task details with safe assigned volunteer and creator details (no `passwordHash`).
- `GET /api/volunteer/tasks`: Authenticated volunteer lists only tasks assigned to themselves (derived from `req.user.userId`).
- `GET /api/volunteer/tasks/:id`: Authenticated volunteer retrieves details of their assigned task. Returns `403 Forbidden` if assigned to another volunteer.

## Implemented Volunteer Task Submission (Milestone 5)
- `POST /api/volunteer/tasks/:id/submit`: Authenticated volunteer submits an assigned task with `actualHours` (0 < hours <= 24) and non-empty `completionNotes`. Atomically creates `TaskSubmission` (`reviewStatus = PENDING`, `approvedHours = 0`, server-generated `submittedAt`) and transitions `Task.status` to `SUBMITTED`. Prevents duplicate submission (409 Conflict) and cross-volunteer access (403 Forbidden).
- `GET /api/volunteer/tasks/:id/submission`: Authenticated volunteer retrieves their submission for an assigned task. Returns `403 Forbidden` if assigned to another volunteer, `404 Not Found` if no submission exists.

## Implemented Admin Review & Official Service Hours (Milestone 6)
- `GET /api/admin/submissions`: Admin lists task submissions with filtering (`reviewStatus`, `volunteerId`) and pagination.
- `GET /api/admin/submissions/:id`: Admin retrieves single submission details with task, volunteer, and review metadata.
- `PATCH /api/admin/submissions/:id/approve`: Admin approves pending submission with `approvedHours` (bounded by `actualHours` and `expectedHours`) and optional `reviewNotes`. Atomically sets `reviewStatus = APPROVED`, `Task.status = APPROVED`. Prevents double review (409 Conflict).
- `PATCH /api/admin/submissions/:id/reject`: Admin rejects pending submission with mandatory `reviewNotes`. Atomically sets `reviewStatus = REJECTED`, `approvedHours = 0`, `Task.status = REJECTED`. Prevents double review (409 Conflict).
- `GET /api/admin/volunteers/:id/hours`: Admin retrieves dynamic verified official service hours for a volunteer (`SUM(approvedHours) WHERE reviewStatus = APPROVED`).
- `GET /api/volunteer/hours`: Authenticated volunteer retrieves their own verified official service hours.

## Implemented Dashboard & Statistics + Functional Frontend UI (Milestone 7)
- **Part A — Database-Backed Dashboard APIs**:
  - `GET /api/admin/dashboard`: Organization-wide KPI metrics (`volunteers`, `tasks`, `submissions`, `serviceHours.official`, `recentTasks`).
  - `GET /api/admin/dashboard/volunteers`: Per-volunteer breakdown (`taskCount`, `approvedTaskCount`, `pendingTaskCount`, `rejectedTaskCount`, dynamic `officialServiceHours`).
  - `GET /api/admin/dashboard/tasks`: Task status distribution counts (`assigned`, `submitted`, `approved`, `rejected`, `total`).
  - `GET /api/volunteer/dashboard`: Authenticated volunteer personal metrics (`tasks` breakdown, `serviceHours.official`, `pendingReviews`, `recentTasks`).
- **Part B — Functional Next.js Frontend (`frontend/`)**:
  - Modern Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 setup.
  - Role-aware authentication context with token persistence (`localStorage`) and auto-restoration via `/api/auth/me`.
  - Unified `/login` page with demo credentials helper.
  - Admin Portal (`/admin/dashboard`, `/admin/volunteers`, `/admin/tasks`, `/admin/submissions`) with status badges, search, pagination, create volunteer/task modals, and approve/reject submission modals.
  - Volunteer Portal (`/volunteer/dashboard`, `/volunteer/tasks`) with verified hours highlight, task submission modal, and feedback view.
  - Handoff-ready for teammate UI enhancement via `21st.dev` (`docs/FRONTEND_DEVELOPMENT.md`).



## Directory Layout
- `src/config/`: Environment configuration (`env.ts`) and Prisma database singleton (`database.ts`).
- `src/controllers/`: Express request handlers (`auth.controller.ts`, `volunteer.controller.ts`, `task.controller.ts`).
- `src/routes/`: Express route definitions grouped by domain (`auth.routes.ts`, `admin.routes.ts`, `volunteer.routes.ts`, `health.routes.ts`, `index.ts`).
- `src/middlewares/`: JWT verification (`auth.middleware.ts`), RBAC (`role.middleware.ts`), error handling (`error.middleware.ts`).
- `src/services/`: Business logic (`auth.service.ts`, `volunteer.service.ts`, `task.service.ts`), dynamic hours calculation.
- `src/utils/`: JWT (`jwt.ts`), password hashing (`password.ts`), custom AppError (`app-error.ts`), response formatters (`response.ts`).
- `src/types/`: TypeScript interfaces and Express Request augmentation.
- `prisma/`: Prisma schema (`schema.prisma`) and seed (`seed.ts`).
- `docs/`: Architectural, API, and database specifications.

## Important Development Constraints
- Keep code clean, modular, and readable (student-appropriate, production-ready architecture).
- Strict separation between Admin and Volunteer capabilities.
- Always use parameterized queries / Prisma client to prevent SQL injection.
- Validate request payloads before processing.
