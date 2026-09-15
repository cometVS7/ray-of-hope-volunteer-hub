# Development & Setup Guide

## 1. Prerequisites
- **Node.js**: v18+ or v20+ LTS
- **npm** or **pnpm** / **yarn**
- **PostgreSQL Database**: Neon serverless Postgres connection string (or local PostgreSQL during local test)
- **Git**

---

## 2. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Neon PostgreSQL connection string)
DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

---

## 3. Recommended Project Scripts (Once package.json is initialized)

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Start dev server with hot reload |
| `build` | `tsc` | Compile TypeScript to JavaScript in `dist/` |
| `start` | `node dist/server.js` | Run compiled production build |
| `prisma:generate` | `prisma generate` | Generate Prisma Client types |
| `prisma:migrate` | `prisma migrate dev` | Apply schema migrations in dev |
| `prisma:studio` | `prisma studio` | Visual database browser |
| `seed` | `tsx prisma/seed.ts` | Seed initial Admin and sample volunteers |

---

## 4. Git Workflow

### Branch Strategy
- `main`: Production-ready code.
- `dev` or feature branches: Feature-specific branches (e.g., `feat/auth-jwt`, `feat/admin-tasks`, `feat/submission-review`).

### Commit Message Convention
Follow Conventional Commits:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `chore:` Changes to build process or auxiliary tools

### Pull Request & Review Flow
1. Branch off from `main`.
2. Implement backend service/endpoints with unit/integration testing.
3. Verify Prisma schema and migrations.
4. Open PR with clear summary and API testing verification evidence.
