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

### `GET /api/admin/volunteers`
- **Description**: List volunteers with search, filtering, and pagination.
- **Access**: Admin only.
- **Query Params**:
  - `search`: Filter by name or `volunteerId`
  - `status`: `ACTIVE` | `INACTIVE`
  - `page`: default `1`
  - `limit`: default `20`

### `POST /api/admin/volunteers`
- **Description**: Create a new volunteer account.
- **Access**: Admin only.
- **Request Body**:
  ```json
  {
    "name": "John Smith",
    "email": "john.smith@example.com",
    "volunteerId": "VOL-1002",
    "phone": "+1234567890",
    "password": "InitialTempPassword123!"
  }
  ```

### `GET /api/admin/volunteers/:id`
- **Description**: Get volunteer profile, statistical metrics (total approved hours, completed tasks, pending tasks), and full task history.
- **Access**: Admin only.

### `PATCH /api/admin/volunteers/:id/status`
- **Description**: Activate or deactivate a volunteer account.
- **Access**: Admin only.
- **Request Body**:
  ```json
  {
    "status": "INACTIVE"
  }
  ```

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
