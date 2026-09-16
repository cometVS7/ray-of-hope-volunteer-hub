import { Router } from 'express';
import taskController from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireVolunteer } from '../middlewares/role.middleware.js';

const router = Router();

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

export default router;
