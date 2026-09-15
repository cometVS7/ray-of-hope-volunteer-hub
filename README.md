# A Ray of Hope — Volunteer Management System

> **A Service Learning Web Application for A Ray of Hope Foundation (NGO)**

---

## 🌟 Project Purpose
A simple, robust volunteer management platform enabling NGO administrators to manage volunteers, assign tasks, and verify official service hours, while empowering volunteers to view assignments, submit work completion logs, and track verified service hours.

---

## 🏛️ System Architecture & Technology Stack

- **Backend**: Node.js, Express, TypeScript, REST API
- **Database**: PostgreSQL on Neon (Cloud-hosted serverless PostgreSQL)
- **ORM**: Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with `bcrypt` password hashing & Role-Based Access Control (`ADMIN`, `VOLUNTEER`)
- **Frontend (Separate Team)**: Next.js, TypeScript, Tailwind CSS, 21st.dev UI components

---

## 📋 Core Workflows

### 🛡️ Admin Workflow
1. Log in securely using email and password.
2. Add new volunteers (generates Volunteer ID, e.g. `VOL-1001`).
3. Search and filter volunteers by name or Volunteer ID.
4. View volunteer profile, statistical metrics, and task history.
5. Create tasks with title, description, expected hours, deadline, and assigned volunteer.
6. Review submitted tasks in the "Submissions Awaiting Review" queue.
7. Approve or reject submissions (approved hours are officially credited to the volunteer).
8. Activate or deactivate volunteer accounts.

### 🤝 Volunteer Workflow
1. Log in using Volunteer ID / Email and password.
2. View volunteer dashboard with verified hours and task breakdown.
3. View tasks categorized by state (`Assigned`, `In Progress`, `Submitted`, `Approved/Completed`, `Rejected`).
4. Click "Done — Send for Review", entering actual hours and completion notes.
5. Service hours remain pending until reviewed.
6. Upon Admin approval, official service hours are credited to their record.

---

## ⚖️ Critical Business Rule

> **Official volunteer service hours must come ONLY from APPROVED task submissions.**
> 
> When a volunteer submits actual hours for a task (`Status = SUBMITTED`), those hours **do not** count toward official hours. Only after an Admin reviews and sets `Status = APPROVED` do the verified hours get officially added.

---

## 📚 Documentation Index

Detailed architectural and design specifications:
- 🏗️ [System Architecture](file:///docs/ARCHITECTURE.md)
- 🗄️ [Database Design & Schema](file:///docs/DATABASE_DESIGN.md)
- 🔄 [Task Lifecycle & Verification](file:///docs/TASK_LIFECYCLE.md)
- 🔐 [Authentication & Security](file:///docs/AUTH_AND_SECURITY.md)
- 📡 [REST API Specification](file:///docs/API_SPECIFICATION.md)
- 🛠️ [Development & Git Guide](file:///docs/DEVELOPMENT_GUIDE.md)
- 🤖 [AI Session Context & Guidelines](file:///AGENTS.md)
