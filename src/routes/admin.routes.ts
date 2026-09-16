import { Router } from 'express';
import volunteerController from '../controllers/volunteer.controller.js';
import taskController from '../controllers/task.controller.js';
import taskReviewController from '../controllers/task-review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// ==========================================
// ADMIN VOLUNTEER MANAGEMENT ROUTES
// ==========================================
// Enforce authentication and Admin-only RBAC for all volunteer management routes
router.use('/volunteers', authenticate, requireAdmin);

// POST /api/admin/volunteers - Create a volunteer
router.post('/volunteers', (req, res, next) => {
  volunteerController.createVolunteer(req, res, next);
});

// GET /api/admin/volunteers - List volunteers with search & pagination
router.get('/volunteers', (req, res, next) => {
  volunteerController.listVolunteers(req, res, next);
});

// GET /api/admin/volunteers/:id/hours - Get official approved service hours for a volunteer
router.get('/volunteers/:id/hours', (req, res, next) => {
  taskReviewController.getVolunteerHoursForAdmin(req, res, next);
});

// GET /api/admin/volunteers/:id - Get individual volunteer profile
router.get('/volunteers/:id', (req, res, next) => {
  volunteerController.getVolunteerById(req, res, next);
});

// PATCH /api/admin/volunteers/:id/status - Activate or deactivate a volunteer
router.patch('/volunteers/:id/status', (req, res, next) => {
  volunteerController.updateVolunteerStatus(req, res, next);
});

// ==========================================
// ADMIN TASK MANAGEMENT ROUTES
// ==========================================
// Enforce authentication and Admin-only RBAC for all task management routes
router.use('/tasks', authenticate, requireAdmin);

// POST /api/admin/tasks - Create and assign a task
router.post('/tasks', (req, res, next) => {
  taskController.createTask(req, res, next);
});

// GET /api/admin/tasks - List tasks with filtering and pagination
router.get('/tasks', (req, res, next) => {
  taskController.listTasks(req, res, next);
});

// GET /api/admin/tasks/:id - Get individual task details
router.get('/tasks/:id', (req, res, next) => {
  taskController.getTaskById(req, res, next);
});

// ==========================================
// ADMIN TASK SUBMISSION REVIEW ROUTES
// ==========================================
// Enforce authentication and Admin-only RBAC for all submission review routes
router.use('/submissions', authenticate, requireAdmin);

// GET /api/admin/submissions - List submissions awaiting or having completed review
router.get('/submissions', (req, res, next) => {
  taskReviewController.listSubmissions(req, res, next);
});

// GET /api/admin/submissions/:id - Get single submission details
router.get('/submissions/:id', (req, res, next) => {
  taskReviewController.getSubmissionById(req, res, next);
});

// PATCH /api/admin/submissions/:id/approve - Approve a task submission
router.patch('/submissions/:id/approve', (req, res, next) => {
  taskReviewController.approveSubmission(req, res, next);
});

// PATCH /api/admin/submissions/:id/reject - Reject a task submission with notes
router.patch('/submissions/:id/reject', (req, res, next) => {
  taskReviewController.rejectSubmission(req, res, next);
});

export default router;

