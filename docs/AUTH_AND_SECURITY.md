# Authentication & Role-Based Access Control (RBAC)

## 1. Authentication Strategy

The system utilizes **Stateless JWT (JSON Web Tokens)** for authentication and **`bcrypt`** (salt rounds = 10) for secure password hashing.

### Token Architecture
- **Bearer Token**: Transmitted in HTTP `Authorization` header: `Authorization: Bearer <jwt_token>`.
- **JWT Payload**:
  ```json
  {
    "userId": "uuid-v4-string",
    "role": "ADMIN" | "VOLUNTEER",
    "email": "user@example.com",
    "volunteerId": "ARH-VOL-001",
    "iat": 1726420000,
    "exp": 1727024800
  }
  ```

---

## 2. Authentication Endpoints

### `POST /api/auth/login`
- **Access**: Public
- **Supported Login Payloads**:
  - **Admin**:
    ```json
    {
      "email": "admin@rayofhope.org",
      "password": "Admin@123"
    }
    ```
  - **Volunteer (by Volunteer ID)**:
    ```json
    {
      "volunteerId": "ARH-VOL-001",
      "password": "Volunteer@123"
    }
    ```
  - **Volunteer (by Email)**:
    ```json
    {
      "email": "volunteer1@rayofhope.org",
      "password": "Volunteer@123"
    }
    ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "c1f7...",
        "name": "Alex Johnson",
        "email": "volunteer1@rayofhope.org",
        "role": "VOLUNTEER",
        "volunteerId": "ARH-VOL-001",
        "phone": "+1234567890",
        "status": "ACTIVE"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: When password or identifier is missing.
  - `401 Unauthorized`: Returns generic `"Invalid credentials"` if user not found, password does not match, or user status is `INACTIVE`.

### `GET /api/auth/me`
- **Access**: Authenticated (Requires `Authorization: Bearer <jwt_token>`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Authenticated user",
    "data": {
      "id": "c1f7...",
      "name": "Alex Johnson",
      "email": "volunteer1@rayofhope.org",
      "role": "VOLUNTEER",
      "volunteerId": "ARH-VOL-001",
      "phone": "+1234567890",
      "status": "ACTIVE",
      "createdAt": "2026-09-15T18:00:00.000Z",
      "updatedAt": "2026-09-15T18:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing, expired, or malformed JWT token.

---

## 3. Role-Based Access Control (RBAC) Middleware

Two middlewares enforce authentication and authorization:

```typescript
// 1. JWT Authentication Guard
import { authenticate } from '../middlewares/auth.middleware.js';

// 2. Role Authorization Guard
import { requireRole, requireAdmin, requireVolunteer } from '../middlewares/role.middleware.js';

// Examples:
router.use('/admin', authenticate, requireAdmin);
router.use('/volunteer', authenticate, requireVolunteer);
```

### Access Matrix

| Endpoint Group | Admin Access | Volunteer Access | Unauthenticated |
|---|:---:|:---:|:---:|
| `POST /api/auth/login` | Allowed | Allowed | Allowed |
| `GET /api/auth/me` | Allowed | Allowed | Denied (401) |
| `GET /api/health` | Allowed | Allowed | Allowed |
| `All /api/admin/*` | Full Access | Denied (403) | Denied (401) |
| `All /api/volunteer/*` | Denied (403) | Own Data Only | Denied (401) |

---

## 4. Development Seed Test Credentials

When connected to the PostgreSQL database, run `npm run seed` to insert the following development accounts:

| Role | Identifier | Password | Notes |
|---|---|---|---|
| **ADMIN** | `admin@rayofhope.org` | `Admin@123` | System Administrator account |
| **VOLUNTEER** | `ARH-VOL-001` (or `volunteer1@rayofhope.org`) | `Volunteer@123` | Active test volunteer account |

> ⚠️ **IMPORTANT**: These credentials are strictly for development/testing and must be removed or passwords changed before deploying to production.
