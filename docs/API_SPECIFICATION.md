# REST API Specification

All API endpoints are prefixed with `/api`.
Standard response envelope format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response envelope:
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": []
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
- **Description**: Authenticates Admin or Volunteer.
- **Access**: Public.
- **Request Body**:
  ```json
  {
    "identifier": "VOL-1001", // or "admin@rayofhope.org"
    "password": "Password123!"
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
        "id": "uuid-1234",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "VOLUNTEER",
        "volunteerId": "VOL-1001",
        "status": "ACTIVE"
      }
    }
  }
  ```

### `GET /api/auth/me`
- **Description**: Retrieves current authenticated profile.
- **Access**: Authenticated (Bearer Token).

---

## 2. Admin — Volunteer Management (`/api/admin/volunteers`)

All endpoints in this group require authentication and `ADMIN` role (`authenticate` + `requireAdmin`).
Unauthenticated requests receive `401 Unauthorized`.
Volunteer requests receive `403 Forbidden`.

### `POST /api/admin/volunteers`
- **Description**: Create a new volunteer account with an automatically generated sequential Volunteer ID (`ARH-VOL-001`, `ARH-VOL-002`, etc.).
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Request Body**:
  ```json
  {
    "name": "Alex Johnson",
    "email": "alex@example.com",
    "password": "Volunteer@123",
    "phone": "+919876543210"
  }
  ```
  - `name`: Required, non-empty string.
  - `email`: Required, valid email format (must be unique).
  - `password`: Required, minimum 6 characters (bcrypt hashed with work factor 10).
  - `phone`: Optional string.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Volunteer created successfully",
    "data": {
      "id": "7820e181-4ba2-47d3-9584-...",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "role": "VOLUNTEER",
      "volunteerId": "ARH-VOL-002",
      "phone": "+919876543210",
      "status": "ACTIVE",
      "createdAt": "2026-09-15T18:30:00.000Z",
      "updatedAt": "2026-09-15T18:30:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (empty name, invalid email, password < 6 chars).
  - `409 Conflict`: A user with this email already exists (`"A user with this email already exists"`).

### `GET /api/admin/volunteers`
- **Description**: List volunteers with search, status filtering, and pagination.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Query Params**:
  - `search`: Filter by volunteer `name`, `volunteerId` (e.g. `ARH-VOL-001`), or `email`.
  - `status`: Filter by status (`ACTIVE` | `INACTIVE`).
  - `page`: Page number (default: `1`, minimum: `1`).
  - `limit`: Items per page (default: `20`, maximum: `100`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Volunteers retrieved successfully",
    "data": {
      "volunteers": [
        {
          "id": "7820e181-4ba2-47d3-9584-...",
          "name": "Alex Johnson",
          "email": "alex@example.com",
          "role": "VOLUNTEER",
          "volunteerId": "ARH-VOL-001",
          "phone": "+919876543210",
          "status": "ACTIVE",
          "createdAt": "2026-09-15T18:00:00.000Z",
          "updatedAt": "2026-09-15T18:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

### `GET /api/admin/volunteers/:id`
- **Description**: Get individual volunteer profile by database UUID.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Volunteer retrieved successfully",
    "data": {
      "id": "7820e181-4ba2-47d3-9584-...",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "role": "VOLUNTEER",
      "volunteerId": "ARH-VOL-001",
      "phone": "+919876543210",
      "status": "ACTIVE",
      "createdAt": "2026-09-15T18:00:00.000Z",
      "updatedAt": "2026-09-15T18:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Volunteer with specified ID does not exist or is not a volunteer.

### `PATCH /api/admin/volunteers/:id/status`
- **Description**: Activate (`ACTIVE`) or deactivate (`INACTIVE`) a volunteer. Soft status toggle preserves task/submission history; hard deletion (`DELETE`) is intentionally disabled.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Request Body**:
  ```json
  {
    "status": "INACTIVE"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Volunteer status updated successfully",
    "data": {
      "id": "7820e181-4ba2-47d3-9584-...",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "role": "VOLUNTEER",
      "volunteerId": "ARH-VOL-001",
      "phone": "+919876543210",
      "status": "INACTIVE",
      "createdAt": "2026-09-15T18:00:00.000Z",
      "updatedAt": "2026-09-15T18:35:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid status value (must be `ACTIVE` or `INACTIVE`), or target user is an Admin.
  - `404 Not Found`: Volunteer not found.

---

## 3. Admin — Task Management & Review (`/api/admin/tasks`, `/api/admin/submissions`)

### `POST /api/admin/tasks`
- **Description**: Create a new task and assign it to a volunteer.
- **Access**: Admin only.
- **Request Body**:
  ```json
  {
    "title": "Weekend Food Pantry Distribution",
    "description": "Distribute essential groceries to local community families.",
    "expectedHours": 4.0,
    "deadline": "2026-09-25T18:00:00.000Z",
    "assignedToId": "volunteer-uuid"
  }
  ```

### `GET /api/admin/tasks`
- **Description**: List all tasks across the system with status/volunteer filter.
- **Access**: Admin only.

### `GET /api/admin/submissions/pending`
- **Description**: Fetch all task submissions awaiting admin review.
- **Access**: Admin only.

### `POST /api/admin/submissions/:submissionId/review`
- **Description**: Approve or reject a volunteer's task submission.
- **Access**: Admin only.
- **Request Body (Approve)**:
  ```json
  {
    "action": "APPROVE",
    "approvedHours": 4.0,
    "reviewNotes": "Great effort, well documented."
  }
  ```
- **Request Body (Reject)**:
  ```json
  {
    "action": "REJECT",
    "reviewNotes": "Please attach the activity log sheet before hours can be approved."
  }
  ```

---

## 4. Admin — Analytics & Overview (`/api/admin/overview`)

### `GET /api/admin/overview`
- **Description**: High-level metrics for admin dashboard:
  - Total Active Volunteers
  - Total Verified Hours Across All Volunteers
  - Pending Submissions Count
  - Active / Open Tasks Count
- **Access**: Admin only.

---

## 5. Volunteer Endpoints (`/api/volunteer`)

### `GET /api/volunteer/dashboard`
- **Description**: Volunteer's dashboard summary:
  - Total verified/approved service hours
  - Tasks summary count (Assigned, In Progress, Submitted, Completed, Rejected)
  - Upcoming deadlines
- **Access**: Volunteer only.

### `GET /api/volunteer/tasks`
- **Description**: List tasks assigned to the logged-in volunteer.
- **Access**: Volunteer only.
- **Query Params**:
  - `status`: `ASSIGNED` | `IN_PROGRESS` | `SUBMITTED` | `APPROVED` | `REJECTED`

### `GET /api/volunteer/tasks/:id`
- **Description**: Details of a specific assigned task with its submission/review details.
- **Access**: Volunteer only (scoped to own task).

### `POST /api/volunteer/tasks/:id/submit`
- **Description**: Submit a completed task for review.
- **Access**: Volunteer only.
- **Request Body**:
  ```json
  {
    "actualHours": 4.5,
    "completionNotes": "Distributed food packets to 35 families and organized the inventory."
  }
  ```

### `PATCH /api/volunteer/tasks/:id/status`
- **Description**: Mark an assigned task as `IN_PROGRESS`.
- **Access**: Volunteer only.
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```
