# Ray of Hope Foundation — Volunteer Management System

> **A modern, full-stack Service Learning platform built for A Ray of Hope Foundation (Pune, Maharashtra) to streamline volunteer onboarding, community-service task lifecycle tracking, administrative review, and dynamically verified official service hours.**

---

## 📌 Project Overview

**Ray of Hope Foundation — Volunteer Management System** is a production-grade web application tailored for non-governmental organizations (NGOs) to eliminate paper logs, prevent fraudulent service claims, and provide transparent hour tracking.

### Organization & Mentorship
- **Organization**: A Ray of Hope Foundation
- **Location**: Pune, Maharashtra, India
- **NGO Mentor**: **Mr. Sanjay Kumar**

---

## ✨ Features

- **🔐 Dual-Role Authentication & RBAC**:
  - Secure JWT authentication with `bcrypt` password hashing (salt rounds = 10).
  - Multi-identifier login: Administrators sign in with email; Volunteers sign in using their unique ID (e.g. `ARH-VOL-001`) or email.
  - Strict Role-Based Access Control (`ADMIN`, `VOLUNTEER`) with automated route guarding and token auto-refresh.

- **👥 Volunteer Management (Admin)**:
  - Automated sequential ID allocation (`ARH-VOL-001` through `ARH-VOL-018+`).
  - Search by name, email, or volunteer ID, with status filtering (`ACTIVE`, `INACTIVE`) and pagination.
  - Individual volunteer profile inspection, assignment history, and account activation/deactivation.

- **📋 Task Lifecycle Management**:
  - Administrative creation and assignment of tasks with expected hours, deadlines, and descriptions.
  - Simplified, robust status lifecycle: `ASSIGNED` ➔ `SUBMITTED` ➔ `APPROVED` or `REJECTED`.
  - Comprehensive filtering by status, volunteer assignee, and keyword search.

- **⏱️ Volunteer Submission & Verification Queue**:
  - Volunteers log actual hours worked along with completion notes upon task finish.
  - Dedicated Administrative Review Queue with "Action Required" badges.
  - Approval workflow with hours validation (`approvedHours` bounded by `actualHours` and `expectedHours`).
  - Constructive rejection workflow requiring mandatory feedback notes for resubmission.

- **⚖️ Dynamic Verified Service Hours (Single Source of Truth)**:
  - Official volunteer service hours accrue **ONLY** from approved task submissions:
    $$\text{Official Hours} = \sum \text{approvedHours} \quad \text{where } \text{reviewStatus} = \text{'APPROVED'}$$
  - No static aggregate hours stored on the user record, guaranteeing 100% data integrity without drift.

- **📊 Comprehensive Dashboards & Analytics**:
  - **Admin Dashboard**: Live KPI metric counters, task status breakdown, volunteer leaderboard, and recent activity.
  - **Volunteer Dashboard**: Personal verified service hours, active task pipeline, completion rate, and impact stats.
  - **Impact Certificate**: Verified digital service certificate with official NGO mentor attribution and seal.

- **⚙️ Administrator Account & Profile Management**:
  - Multi-admin support with Master Admin badges, profile updates, and secure password changes.

- **📱 Modern Responsive UI & Visuals**:
  - Sleek, warm light-themed UI built with Next.js 16 App Router, React 19, and Tailwind CSS 4.
  - Animated stat counters, glassmorphic cards, and responsive drawer navigation for desktop, laptop, and mobile viewports.

---

## 🛠️ Tech Stack

### Backend
- **Runtime & Framework**: Node.js & Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (serverless on Neon)
- **ORM**: Prisma ORM v5
- **Security & Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, CORS, Helmet

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Core Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 & Vanilla CSS tokens
- **Design Language**: 21st.dev-inspired modern glassmorphic dashboard aesthetics
- **Icons**: Lucide React

---

## 📸 Screenshots

### Login
Clean, branded split-screen portal with dual-role authentication (Admin / Volunteer).
![Ray of Hope Login](docs/screenshots/login.png)

### Admin Dashboard
Executive overview with live KPI counters, task pipeline distribution, and volunteer leaderboard.
![Ray of Hope Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Volunteer Management
Searchable, filterable volunteer directory with status indicators and profile inspection.
![Volunteer Management](docs/screenshots/volunteers.png)

### Task Management
End-to-end task assignment table with deadline tracking and status indicators.
![Task Management](docs/screenshots/tasks.png)

### Review Queue
Administrative verification queue displaying completion notes, actual hours, and approval dialogs.
![Review Queue](docs/screenshots/review-queue.png)

### Volunteer Dashboard
Personalized dashboard displaying verified official service hours, active assignments, and completion history.
![Volunteer Dashboard](docs/screenshots/volunteer-dashboard.png)

### Settings & Administrator Management
Profile details, password security, and active administrator directory.
![Settings](docs/screenshots/settings.png)

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 16 / React 19)"]
        UI["Tailwind CSS 4 + Responsive UI"]
        AuthCtx["Auth Context (JWT + LocalStorage)"]
    end

    subgraph Server ["Backend (Node.js / Express REST API)"]
        Routes["Express API Routes (/api/...)"]
        AuthMW["JWT & RBAC Middlewares"]
        Services["Business Logic & Dynamic Hours Service"]
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        Prisma["Prisma ORM Client"]
        NeonDB[("Neon Serverless PostgreSQL")]
    end

    UI -->|HTTP / JSON Requests| Routes
    AuthCtx -->|Bearer Token Header| AuthMW
    AuthMW --> Routes
    Routes --> Services
    Services --> Prisma
    Prisma --> NeonDB
```

### Dynamic Hours Calculation Rule
Official service hours are **never** stored as a mutable total on the `User` model. Instead, they are calculated in real time:
```sql
SELECT COALESCE(SUM("approvedHours"), 0) AS "officialServiceHours"
FROM "TaskSubmission"
WHERE "volunteerId" = :volunteerId
  AND "reviewStatus" = 'APPROVED';
```
This guarantees that unverified submissions or pending hours never inflate official volunteer service records.

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` or higher
- **npm**: `v9.x` or higher
- **PostgreSQL Database**: PostgreSQL 14+ instance or cloud-hosted database (e.g. Neon)

### 1. Clone the Repository
```bash
git clone https://github.com/cometVS7/ray-of-hope-volunteer-hub.git
cd ray-of-hope-volunteer-hub
```

### 2. Install Dependencies

Install root backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@your-neon-host/dbname?sslmode=require"
JWT_SECRET="your_local_jwt_secret_key_minimum_32_characters"
JWT_EXPIRES_IN=7d
FRONTEND_URL="http://localhost:3000"
```

Create a `.env.local` file inside the `frontend/` directory (if customizing API URL):
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### 4. Database Setup & Migrations
```bash
# Push Prisma schema to your database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 5. Seed Development Data
Seed the database with realistic Pune/Maharashtra volunteer and task records:
```bash
npm run prisma:seed
```

> **Demo Dataset Summary**:
> The development seed generates:
> - **1 Master Admin account** (`admin@rayofhope.org`)
> - **18 Pune/Maharashtra Volunteers** (16 Active, 2 Inactive with IDs `ARH-VOL-001` through `ARH-VOL-018`)
> - **25 realistic NGO Tasks** (Blood donation drives, slum education, tree plantation, food distribution)
> - **17 Submissions** with varied lifecycles (`ASSIGNED`, `SUBMITTED`, `APPROVED`, `REJECTED`)
> - **37.5 Verified Service Hours** dynamically calculated

### 6. Run the Application

Start the backend server:
```bash
npm run dev
# Backend runs at http://localhost:5000
```

In a separate terminal, start the frontend development server:
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:3000
```

Verify services:
- **Backend Health Check**: `http://localhost:5000/api/health`
- **Frontend Application**: `http://localhost:3000`

---

## 🧪 Build & Verification Commands

```bash
# Backend type checking
npm run type-check

# Backend production build
npm run build

# Prisma schema validation
npx prisma validate

# Frontend production build
cd frontend
npm run build
```

---

## 📄 License & Attribution

Developed for **A Ray of Hope Foundation**, Pune, Maharashtra, under the mentorship of **Mr. Sanjay Kumar**.  
All rights reserved © 2026 A Ray of Hope Foundation.
