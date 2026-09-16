# A Ray of Hope — Frontend Architecture & Development Guide

## 1. Overview
The frontend for **A Ray of Hope — Volunteer Management System** is a modern, responsive web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS 4**.

It communicates with the Express + Prisma + PostgreSQL REST backend to provide two distinct, role-guarded user portals:
1. **Admin Portal** (`/admin/*`): Manage volunteer accounts, assign tasks, review task submissions, and monitor real-time organizational KPIs.
2. **Volunteer Portal** (`/volunteer/*`): Track assigned tasks, log completed service hours with completion notes, submit work for verification, and view dynamic verified official service hours.

---

## 2. Directory Structure

```
frontend/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx      # Admin metrics, KPI cards, recent tasks, volunteer table
│   │   ├── volunteers/page.tsx     # Volunteer directory, search, status toggle, Add Volunteer modal
│   │   ├── tasks/page.tsx          # Task list, search, status filter, Create Task modal
│   │   ├── submissions/page.tsx    # Submissions review, filter, Approve & Reject modals
│   │   └── layout.tsx              # Admin route guard (role === 'ADMIN'), Navbar & Sidebar shell
│   ├── volunteer/
│   │   ├── dashboard/page.tsx      # Personal metrics, verified official hours, recent tasks
│   │   ├── tasks/page.tsx          # Assigned tasks, submit work modal, review feedback view
│   │   └── layout.tsx              # Volunteer route guard (role === 'VOLUNTEER'), Navbar & Sidebar shell
│   ├── login/
│   │   └── page.tsx                # Unified login (Admin: email+pw, Volunteer: ID or email+pw)
│   ├── layout.tsx                  # Root layout, AuthProvider, Inter font, metadata
│   ├── page.tsx                    # Root redirector (routes to /admin/dashboard, /volunteer/dashboard, or /login)
│   └── globals.css                 # Tailwind CSS 4 setup and global styles
├── components/
│   ├── Modal.tsx                   # Accessible, responsive dialog with backdrop blur and escape key handling
│   ├── Navbar.tsx                  # Top navigation bar with user profile badge and logout button
│   ├── Sidebar.tsx                 # Responsive side navigation with role-specific portal links
│   ├── StatCard.tsx                # Metric KPI card with left-border accent colors
│   └── StatusBadge.tsx             # Color-coded badges for all Task, Review, and User statuses
├── lib/
│   ├── api.ts                      # Centralized fetch client injecting Bearer token & error normalization
│   └── auth-context.tsx            # React Context & useAuth() hook for session persistence & RBAC
├── types/
│   └── index.ts                    # Shared TypeScript interfaces for API models and DTOs
├── .env.example                    # Template for client environment configuration
├── .env.local                      # Local environment overrides (NEXT_PUBLIC_API_URL)
└── next.config.ts                  # Next.js configuration (Turbopack workspace root)
```

---

## 3. Environment Configuration & Setup

### Environment Variables
Copy the example file into `.env.local`:
```bash
cp .env.example .env.local
```

Default configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Running Locally
From the `frontend/` directory:
```bash
# Install dependencies (already completed)
npm install

# Run development server (port 3000)
npm run dev

# Run production build
npm run build

# Start production server
npm start
```

---

## 4. Authentication & Role-Based Access Control (RBAC)

### Session Lifecycle (`lib/auth-context.tsx`)
- **Login**: Calls `POST /api/auth/login`. On success, receives `{ token, user }`. The JWT is stored in `localStorage` under `token`, and the user object is saved to React state.
- **Auto-Restoration**: On initial page mount, if a token exists in `localStorage`, the client calls `GET /api/auth/me` to validate the token and restore the user's role and profile.
- **Logout**: Clears `token` from `localStorage`, resets user state to `null`, and redirects to `/login`.

### Route Guards (`admin/layout.tsx` & `volunteer/layout.tsx`)
- If the user is unauthenticated, the layout redirects immediately to `/login`.
- If a volunteer attempts to navigate directly to `/admin/*`, the layout redirects them to `/volunteer/dashboard`.
- If an admin attempts to navigate to `/volunteer/*`, the layout redirects them to `/admin/dashboard`.

---

## 5. Key Workflows & API Mapping

| Workflow | Frontend Route | Backend Endpoint | Method | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `/login` | `/api/auth/login` | `POST` | Authenticate using email/Volunteer ID and password. |
| **Profile Restore** | Global | `/api/auth/me` | `GET` | Retrieve authenticated user profile on page reload. |
| **Admin Overview** | `/admin/dashboard` | `/api/admin/dashboard` | `GET` | High-level summary of volunteers, tasks, submissions, official hours. |
| **Volunteer Stats** | `/admin/dashboard` | `/api/admin/dashboard/volunteers` | `GET` | Individual volunteer performance and verified hours. |
| **List Volunteers** | `/admin/volunteers` | `/api/admin/volunteers` | `GET` | Paginated volunteer directory with search & status filters. |
| **Create Volunteer** | `/admin/volunteers` | `/api/admin/volunteers` | `POST` | Admin registers volunteer; receives auto-generated ID (e.g., `ARH-VOL-002`). |
| **Toggle Status** | `/admin/volunteers` | `/api/admin/volunteers/:id/status` | `PATCH` | Activate or deactivate volunteer account. |
| **List Tasks** | `/admin/tasks` | `/api/admin/tasks` | `GET` | Paginated task list with status/search filtering. |
| **Create Task** | `/admin/tasks` | `/api/admin/tasks` | `POST` | Assign task with title, description, expected hours, deadline. |
| **List Submissions** | `/admin/submissions`| `/api/admin/submissions` | `GET` | Review pending, approved, and rejected volunteer submissions. |
| **Approve Task** | `/admin/submissions`| `/api/admin/submissions/:id/approve` | `PATCH` | Officially verify service hours (bounded by actual hours). |
| **Reject Task** | `/admin/submissions`| `/api/admin/submissions/:id/reject` | `PATCH` | Reject task with mandatory feedback for volunteer revision. |
| **Volunteer Dashboard** | `/volunteer/dashboard` | `/api/volunteer/dashboard` | `GET` | Personal counters and official verified service hours. |
| **My Assigned Tasks** | `/volunteer/tasks` | `/api/volunteer/tasks` | `GET` | View tasks assigned to the logged-in volunteer. |
| **Submit Task** | `/volunteer/tasks` | `/api/volunteer/tasks/:id/submit` | `POST` | Submit work with actual hours and completion notes. |
| **View Submission** | `/volunteer/tasks` | `/api/volunteer/tasks/:id/submission` | `GET` | View logged submission, approved hours, or admin feedback. |

---

## 6. Design System & Handoff for UI Enhancement (`21st.dev`)

The frontend is intentionally designed with clean, modular primitives to facilitate seamless future enhancements:

1. **Self-Contained Components**:
   - `StatCard.tsx`, `StatusBadge.tsx`, and `Modal.tsx` have zero external UI library dependencies.
   - Any component can be replaced with a `21st.dev` equivalent simply by updating the component file or swapping the JSX in the page.
2. **Standardized API Client**:
   - All network calls flow through `frontend/lib/api.ts`.
   - Error messages are uniformly parsed, ensuring that forms and modals can display backend errors without ad-hoc try/catch logic.
3. **Strict Type Safety**:
   - All domain objects and DTOs are centralized in `frontend/types/index.ts`.
   - Enhancing the visual presentation does not require modifying type contracts or API payloads.
