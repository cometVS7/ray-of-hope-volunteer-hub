import { Router } from 'express';
import taskController from '../controllers/task.controller.js';
import taskReviewController from '../controllers/task-review.controller.js';
import dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireVolunteer } from '../middlewares/role.middleware.js';

const router = Router();

// ==========================================
// VOLUNTEER DASHBOARD
// ==========================================
// GET /api/volunteer/dashboard - View personal metrics & recent activity
router.get('/dashboard', authenticate, requireVolunteer, (req, res, next) => {
  dashboardController.getVolunteerDashboard(req, res, next);
});

// ==========================================
// VOLUNTEER SERVICE HOURS
// ==========================================
// GET /api/volunteer/hours - View own verified official service hours
router.get('/hours', authenticate, requireVolunteer, (req, res, next) => {
  taskReviewController.getMyVolunteerHours(req, res, next);
});

// ==========================================
// VOLUNTEER TASK ROUTES
// ==========================================
// Enforce authentication and Volunteer-only RBAC for all volunteer task routes
router.use('/tasks', authenticate, requireVolunteer);

// GET /api/volunteer/tasks - List tasks assigned to the authenticated volunteer
router.get('/tasks', (req, res, next) => {
  taskController.listVolunteerTasks(req, res, next);
});

// GET /api/volunteer/tasks/:id - Get individual task assigned to the authenticated volunteer
router.get('/tasks/:id', (req, res, next) => {
  taskController.getVolunteerTaskById(req, res, next);
});

// POST /api/volunteer/tasks/:id/submit - Submit completed task for review
router.post('/tasks/:id/submit', (req, res, next) => {
  taskController.submitTask(req, res, next);
});

// GET /api/volunteer/tasks/:id/submission - View submission details for an assigned task
router.get('/tasks/:id/submission', (req, res, next) => {
  taskController.getVolunteerSubmission(req, res, next);
});

export default router;

