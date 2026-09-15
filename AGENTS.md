# A Ray of Hope — Volunteer Management System (`ray-of-hope-volunteer-hub`)

## Project Context & Mission
"A Ray of Hope — Volunteer Management System" is a Service Learning web application built for the **A Ray of Hope Foundation** (an NGO).
The platform enables NGO administrators to manage volunteers, create and assign tasks, and verify volunteer service hours. Volunteers can track their assigned tasks, log completed hours with completion notes, and submit tasks for administrative review.

## Key Technical Decisions
- **Backend**: Node.js, Express, TypeScript, REST API
- **Database**: PostgreSQL (hosted on Neon), Prisma ORM (*No SQLite*)
- **Authentication**: JWT (JSON Web Tokens), `bcrypt` password hashing, Role-Based Access Control (`ADMIN`, `VOLUNTEER`)
- **Frontend (Separate / Future)**: Next.js, TypeScript, Tailwind CSS, 21st.dev components (communicates via REST API)
- **External Services**: PostgreSQL on Neon (no external APIs)

## Critical Business Rules
1. **Dynamic Verified Service Hours (Single Source of Truth)**:
   - Official volunteer service hours accrue **ONLY** from approved task submissions:
     `SUM(approvedHours) WHERE volunteerId = [volunteer] AND reviewStatus = 'APPROVED'`
   - There is NO duplicate `totalApprovedHours` stored on the User record.
   - When a task is marked `SUBMITTED`, the logged hours do NOT count toward official hours.
   - Only when an Admin explicitly reviews and approves (`reviewStatus = 'APPROVED'`, `Task.status = 'APPROVED'`) do the approved hours count.
2. **Volunteer Identifier**: Volunteers log in using a unique Volunteer ID (e.g., `VOL-1001`) or email and password.
3. **Simplified Task Lifecycle**:
   - `ASSIGNED` -> `SUBMITTED` -> `APPROVED` (Counts hours) OR `REJECTED` (Feedback given, volunteer can resubmit).

## Directory Layout
- `src/config/`: Environment configuration and database setup.
- `src/controllers/`: Express request handlers.
- `src/routes/`: Express route definitions grouped by domain (`auth`, `admin`, `volunteer`, `health`).
- `src/middlewares/`: JWT verification, role-based authorization, validation, error handling.
- `src/services/`: Business logic, dynamic hours calculation, database operations.
- `src/utils/`: Helper functions, token generators, custom AppError, response formatters, prisma client.
- `src/types/`: TypeScript interfaces, custom Express Request types.
- `prisma/`: Prisma schema (`schema.prisma`) and migrations/seed.
- `docs/`: Architectural, API, and database specifications.

## Important Development Constraints
- Keep code clean, modular, and readable (student-appropriate, production-ready architecture).
- Strict separation between Admin and Volunteer capabilities.
- Always use parameterized queries / Prisma client to prevent SQL injection.
- Validate request payloads before processing.
