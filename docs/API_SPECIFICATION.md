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

## 3. Admin — Task Management (`/api/admin/tasks`)

All endpoints in this group require authentication and `ADMIN` role (`authenticate` + `requireAdmin`).

### `POST /api/admin/tasks`
- **Description**: Create and assign a task to an active volunteer. Initial status is always `ASSIGNED`.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Request Body**:
  ```json
  {
    "title": "Community Outreach",
    "description": "Assist with NGO community outreach activity.",
    "expectedHours": 4,
    "assignmentDate": "2026-09-20",
    "deadline": "2026-09-25",
    "assignedToId": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```
  - `title`: Required, non-empty string.
  - `description`: Required, non-empty string.
  - `expectedHours`: Required, positive number > 0.
  - `assignmentDate`: Required, valid date (ISO string or YYYY-MM-DD).
  - `deadline`: Required, valid date (must not be earlier than `assignmentDate`).
  - `assignedToId`: Required UUID of an existing, ACTIVE user with `VOLUNTEER` role.
  - *Note*: `createdById` is automatically populated from the authenticated Admin's JWT.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Task created and assigned successfully",
    "data": {
      "id": "c1f7a0a1-4ba2-47d3-9584-...",
      "title": "Community Outreach",
      "description": "Assist with NGO community outreach activity.",
      "expectedHours": 4,
      "assignmentDate": "2026-09-20T00:00:00.000Z",
      "deadline": "2026-09-25T00:00:00.000Z",
      "status": "ASSIGNED",
      "assignedToId": "550e8400-e29b-41d4-a716-446655440000",
      "createdById": "admin-uuid",
      "assignedTo": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Alex Johnson",
        "email": "volunteer1@rayofhope.org",
        "volunteerId": "ARH-VOL-001",
        "phone": "+1234567890"
      },
      "createdBy": {
        "id": "admin-uuid",
        "name": "System Admin",
        "email": "admin@rayofhope.org"
      },
      "createdAt": "2026-09-16T08:00:00.000Z",
      "updatedAt": "2026-09-16T08:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing fields, expectedHours <= 0, deadline earlier than assignmentDate, assigned user is not a volunteer, or volunteer is inactive.
  - `401 Unauthorized`: Missing or invalid JWT.
  - `403 Forbidden`: Authenticated user is not an Admin.
  - `404 Not Found`: Assigned volunteer not found.

### `GET /api/admin/tasks`
- **Description**: List all tasks across the system with filtering, search, and pagination.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Query Params**:
  - `search`: Filter by task `title` or `description`.
  - `status`: Filter by status (`ASSIGNED` | `SUBMITTED` | `APPROVED` | `REJECTED`).
  - `assignedToId`: Filter tasks assigned to a specific volunteer UUID.
  - `page`: Page number (default: `1`, minimum: `1`).
  - `limit`: Items per page (default: `20`, maximum: `100`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Tasks retrieved successfully",
    "data": {
      "tasks": [
        {
          "id": "c1f7a0a1-4ba2-47d3-9584-...",
          "title": "Community Outreach",
          "description": "Assist with NGO community outreach activity.",
          "expectedHours": 4,
          "assignmentDate": "2026-09-20T00:00:00.000Z",
          "deadline": "2026-09-25T00:00:00.000Z",
          "status": "ASSIGNED",
          "assignedToId": "550e8400-...",
          "createdById": "admin-uuid",
          "assignedTo": { ... },
          "createdBy": { ... },
          "createdAt": "...",
          "updatedAt": "..."
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
- **Error Responses**:
  - `400 Bad Request`: Invalid status filter or invalid page/limit.
  - `401 Unauthorized`: Missing or invalid JWT.
  - `403 Forbidden`: Volunteer role.

### `GET /api/admin/tasks/:id`
- **Description**: Get single task by UUID.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task retrieved successfully",
    "data": {
      "id": "c1f7a0a1-4ba2-47d3-9584-...",
      "title": "Community Outreach",
      "description": "Assist with NGO community outreach activity.",
      "expectedHours": 4,
      "assignmentDate": "2026-09-20T00:00:00.000Z",
      "deadline": "2026-09-25T00:00:00.000Z",
      "status": "ASSIGNED",
      "assignedTo": { ... },
      "createdBy": { ... }
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Task not found.

### `GET /api/admin/submissions`
- **Description**: List task submissions with optional reviewStatus and volunteerId filtering, ordered newest first.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Query Params**:
  - `reviewStatus`: Optional filter (`PENDING` | `APPROVED` | `REJECTED`).
  - `volunteerId`: Optional volunteer user UUID or `volunteerId` (e.g. `ARH-VOL-001`).
  - `page`: Page number (default: `1`).
  - `limit`: Items per page (default: `10`, max: `100`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Submissions retrieved successfully",
    "data": {
      "submissions": [
        {
          "id": "sub-uuid-1234",
          "task": {
            "id": "task-uuid-1",
            "title": "Community Outreach",
            "expectedHours": 4,
            "status": "SUBMITTED"
          },
          "volunteer": {
            "id": "vol-uuid-1",
            "name": "Jane Doe",
            "volunteerId": "ARH-VOL-001"
          },
          "actualHours": 4,
          "completionNotes": "Completed outreach.",
          "submittedAt": "2026-09-16T10:00:00.000Z",
          "reviewStatus": "PENDING",
          "approvedHours": 0,
          "reviewNotes": null,
          "reviewedAt": null,
          "createdAt": "2026-09-16T10:00:00.000Z",
          "updatedAt": "2026-09-16T10:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

### `GET /api/admin/submissions/:id`
- **Description**: Retrieve complete submission details including full task, volunteer, and reviewer details.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Submission retrieved successfully",
    "data": {
      "id": "sub-uuid-1234",
      "task": {
        "id": "task-uuid-1",
        "title": "Community Outreach",
        "description": "Outreach activity details",
        "expectedHours": 4,
        "assignmentDate": "2026-09-20T00:00:00.000Z",
        "deadline": "2026-09-25T00:00:00.000Z",
        "status": "SUBMITTED"
      },
      "volunteer": {
        "id": "vol-uuid-1",
        "name": "Jane Doe",
        "email": "jane@rayofhope.org",
        "volunteerId": "ARH-VOL-001",
        "phone": "+91 98765 43210"
      },
      "actualHours": 4,
      "completionNotes": "Completed outreach.",
      "submittedAt": "2026-09-16T10:00:00.000Z",
      "reviewStatus": "PENDING",
      "approvedHours": 0,
      "reviewNotes": null,
      "reviewedBy": null,
      "reviewedById": null,
      "reviewedAt": null,
      "createdAt": "2026-09-16T10:00:00.000Z",
      "updatedAt": "2026-09-16T10:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Submission not found.

### `PATCH /api/admin/submissions/:id/approve`
- **Description**: Admin approves a pending task submission, setting official `approvedHours` and transitioning both submission and task to `APPROVED` in an atomic transaction.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Request Body**:
  ```json
  {
    "approvedHours": 4,
    "reviewNotes": "Verified completion of the assigned activity."
  }
  ```
  - `approvedHours`: Required, finite number > 0. Must NOT exceed `actualHours` OR `task.expectedHours`.
  - `reviewNotes`: Optional string. Whitespace is trimmed.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task submission approved successfully",
    "data": {
      "id": "sub-uuid-1234",
      "task": {
        "id": "task-uuid-1",
        "title": "Community Outreach",
        "status": "APPROVED"
      },
      "reviewStatus": "APPROVED",
      "approvedHours": 4,
      "reviewNotes": "Verified completion of the assigned activity.",
      "reviewedById": "admin-uuid-1",
      "reviewedAt": "2026-09-16T12:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing/invalid `approvedHours`, `approvedHours <= 0`, `approvedHours > actualHours`, or `approvedHours > task.expectedHours`.
  - `404 Not Found`: Submission does not exist.
  - `409 Conflict`: Submission has already been reviewed (`APPROVED` or `REJECTED`).

### `PATCH /api/admin/submissions/:id/reject`
- **Description**: Admin rejects a pending task submission with mandatory feedback notes, setting `approvedHours = 0` and transitioning both submission and task to `REJECTED` in an atomic transaction.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Request Body**:
  ```json
  {
    "reviewNotes": "Completion evidence was insufficient."
  }
  ```
  - `reviewNotes`: Required, non-empty trimmed string.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task submission rejected successfully",
    "data": {
      "id": "sub-uuid-1234",
      "task": {
        "id": "task-uuid-1",
        "title": "Community Outreach",
        "status": "REJECTED"
      },
      "reviewStatus": "REJECTED",
      "approvedHours": 0,
      "reviewNotes": "Completion evidence was insufficient.",
      "reviewedById": "admin-uuid-1",
      "reviewedAt": "2026-09-16T12:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing or empty `reviewNotes`.
  - `404 Not Found`: Submission does not exist.
  - `409 Conflict`: Submission has already been reviewed (`APPROVED` or `REJECTED`).

### `GET /api/admin/volunteers/:id/hours`
- **Description**: Dynamically calculates official verified service hours for a volunteer from approved submissions.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Volunteer official hours retrieved successfully",
    "data": {
      "volunteer": {
        "id": "vol-uuid-1",
        "name": "Jane Doe",
        "volunteerId": "ARH-VOL-001"
      },
      "officialServiceHours": 12,
      "approvedSubmissions": 3
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Volunteer not found.

### `GET /api/admin/dashboard`
- **Description**: Returns overall system metrics (counts for volunteers, tasks, submissions, official hours) and latest 5 tasks. All statistics are calculated directly from the database without storing aggregates.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Admin dashboard statistics retrieved successfully",
    "data": {
      "volunteers": {
        "total": 10,
        "active": 8,
        "inactive": 2
      },
      "tasks": {
        "total": 25,
        "assigned": 8,
        "submitted": 5,
        "approved": 10,
        "rejected": 2
      },
      "submissions": {
        "total": 17,
        "pending": 5,
        "approved": 10,
        "rejected": 2
      },
      "serviceHours": {
        "official": 42.5
      },
      "recentTasks": [
        {
          "id": "task-uuid-1",
          "title": "Community Outreach",
          "volunteer": {
            "name": "Jane Doe",
            "volunteerId": "ARH-VOL-001"
          },
          "status": "SUBMITTED",
          "assignmentDate": "2026-09-16T00:00:00.000Z",
          "deadline": "2026-09-20T00:00:00.000Z",
          "createdAt": "2026-09-16T10:00:00.000Z"
        }
      ]
    }
  }
  ```

### `GET /api/admin/dashboard/volunteers`
- **Description**: Returns volunteer-level statistics including task distribution by status and verified official service hours.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Volunteer statistics retrieved successfully",
    "data": [
      {
        "id": "vol-uuid-1",
        "name": "Jane Doe",
        "volunteerId": "ARH-VOL-001",
        "status": "ACTIVE",
        "taskCount": 8,
        "approvedTaskCount": 5,
        "pendingTaskCount": 2,
        "rejectedTaskCount": 1,
        "officialServiceHours": 18.5
      }
    ]
  }
  ```

### `GET /api/admin/dashboard/tasks`
- **Description**: Returns task metrics grouped by status and recent tasks.
- **Access**: Admin only (`authenticate` + `requireAdmin`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task statistics retrieved successfully",
    "data": {
      "total": 25,
      "byStatus": {
        "ASSIGNED": 8,
        "SUBMITTED": 5,
        "APPROVED": 10,
        "REJECTED": 2
      },
      "recentTasks": [ ... ]
    }
  }
  ```

---

## 4. Volunteer Endpoints (`/api/volunteer`)

All endpoints in this group require authentication and `VOLUNTEER` role (`authenticate` + `requireVolunteer`).

### `GET /api/volunteer/tasks`
- **Description**: List tasks assigned ONLY to the authenticated volunteer (derived strictly from `req.user.userId`).
- **Access**: Volunteer only (`authenticate` + `requireVolunteer`).
- **Query Params**:
  - `status`: Optional filter (`ASSIGNED` | `SUBMITTED` | `APPROVED` | `REJECTED`).
  - `search`: Optional title/description search.
  - `page`: Page number (default: `1`).
  - `limit`: Items per page (default: `20`, max: `100`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assigned tasks retrieved successfully",
    "data": {
      "tasks": [
        {
          "id": "c1f7a0a1-4ba2-47d3-9584-...",
          "title": "Community Outreach",
          "description": "Assist with NGO community outreach activity.",
          "expectedHours": 4,
          "assignmentDate": "2026-09-20T00:00:00.000Z",
          "deadline": "2026-09-25T00:00:00.000Z",
          "status": "ASSIGNED",
          "assignedTo": { ... },
          "createdBy": { ... }
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

### `GET /api/volunteer/tasks/:id`
- **Description**: Get details of an assigned task. Returns `403 Forbidden` if the task is assigned to another volunteer.
- **Access**: Volunteer only (`authenticate` + `requireVolunteer`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task retrieved successfully",
    "data": {
      "id": "c1f7a0a1-4ba2-47d3-9584-...",
      "title": "Community Outreach",
      "description": "Assist with NGO community outreach activity.",
      "expectedHours": 4,
      "assignmentDate": "2026-09-20T00:00:00.000Z",
      "deadline": "2026-09-25T00:00:00.000Z",
      "status": "ASSIGNED",
      "assignedTo": { ... },
      "createdBy": { ... }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Task belongs to another volunteer.
  - `404 Not Found`: Task does not exist.

### `POST /api/volunteer/tasks/:id/submit`
- **Description**: Submit a completed assigned task for administrative review. Atomically transitions `Task.status` from `ASSIGNED` to `SUBMITTED` and creates a `TaskSubmission` with `reviewStatus = 'PENDING'` and `approvedHours = 0`.
- **Access**: Volunteer only (`authenticate` + `requireVolunteer`).
- **Request Body**:
  ```json
  {
    "actualHours": 4,
    "completionNotes": "Completed the assigned community outreach activity and assisted with volunteer coordination."
  }
  ```
  - `actualHours`: Required, positive finite number (`0 < actualHours <= 24`).
  - `completionNotes`: Required, non-empty trimmed string.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Task submitted successfully for review",
    "data": {
      "task": {
        "id": "c1f7a0a1-4ba2-47d3-9584-...",
        "title": "Community Outreach",
        "status": "SUBMITTED"
      },
      "submission": {
        "id": "sub-uuid-1234",
        "taskId": "c1f7a0a1-4ba2-47d3-9584-...",
        "actualHours": 4,
        "completionNotes": "Completed the assigned community outreach activity and assisted with volunteer coordination.",
        "submittedAt": "2026-09-16T10:00:00.000Z",
        "reviewStatus": "PENDING",
        "approvedHours": 0
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing `actualHours`, `actualHours <= 0`, `actualHours > 24`, missing/empty `completionNotes`, or task status is not `ASSIGNED`.
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Authenticated volunteer does not own this task, or caller is not a volunteer.
  - `404 Not Found`: Task does not exist.
  - `409 Conflict`: Task has already been submitted (`"Task has already been submitted"`).

### `GET /api/volunteer/tasks/:id/submission`
- **Description**: View submission details for an assigned task owned by the authenticated volunteer. When reviewed by admin, includes review status, approved hours, review notes, and reviewedAt.
- **Access**: Volunteer only (`authenticate` + `requireVolunteer`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task submission retrieved successfully",
    "data": {
      "id": "sub-uuid-1234",
      "taskId": "c1f7a0a1-4ba2-47d3-9584-...",
      "volunteerId": "vol-uuid-5678",
      "actualHours": 4,
      "completionNotes": "Completed the assigned community outreach activity and assisted with volunteer coordination.",
      "submittedAt": "2026-09-16T10:00:00.000Z",
      "reviewStatus": "APPROVED",
      "approvedHours": 4,
      "reviewNotes": "Verified completion of the assigned activity.",
      "reviewedById": "admin-uuid-1",
      "reviewedAt": "2026-09-16T12:00:00.000Z",
      "createdAt": "2026-09-16T10:00:00.000Z",
      "updatedAt": "2026-09-16T12:00:00.000Z",
      "task": {
        "id": "c1f7a0a1-4ba2-47d3-9584-...",
        "title": "Community Outreach",
        "status": "APPROVED"
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Task belongs to another volunteer.
  - `404 Not Found`: Task does not exist, or submission has not been created yet for this task.

### `GET /api/volunteer/hours`
- **Description**: Retrieves official verified service hours for the authenticated volunteer. Calculated dynamically: `SUM(approvedHours) WHERE volunteerId = req.user.userId AND reviewStatus = 'APPROVED'`.
- **Access**: Volunteer only (`authenticate` + `requireVolunteer`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Official service hours retrieved successfully",
    "data": {
      "officialServiceHours": 12,
      "approvedSubmissions": 3
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Caller is not a volunteer.

### `GET /api/volunteer/dashboard`
- **Description**: Retrieves personal dashboard metrics for the authenticated volunteer, including task counts by status, official service hours, pending reviews count, and recent 5 tasks.
- **Access**: Volunteer only (`authenticate` + `requireVolunteer`).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Volunteer dashboard retrieved successfully",
    "data": {
      "volunteer": {
        "id": "vol-uuid-1",
        "name": "Jane Doe",
        "volunteerId": "ARH-VOL-001"
      },
      "tasks": {
        "total": 10,
        "assigned": 3,
        "submitted": 2,
        "approved": 4,
        "rejected": 1
      },
      "serviceHours": {
        "official": 18.5
      },
      "pendingReviews": 2,
      "recentTasks": [
        {
          "id": "task-uuid-1",
          "title": "Community Outreach",
          "volunteer": {
            "name": "Jane Doe",
            "volunteerId": "ARH-VOL-001"
          },
          "status": "APPROVED",
          "assignmentDate": "2026-09-16T00:00:00.000Z",
          "deadline": "2026-09-20T00:00:00.000Z",
          "createdAt": "2026-09-16T10:00:00.000Z"
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Caller is not a volunteer.

