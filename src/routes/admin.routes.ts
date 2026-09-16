import { Router } from 'express';
import volunteerController from '../controllers/volunteer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = Router();

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

// GET /api/admin/volunteers/:id - Get individual volunteer profile
router.get('/volunteers/:id', (req, res, next) => {
  volunteerController.getVolunteerById(req, res, next);
});

// PATCH /api/admin/volunteers/:id/status - Activate or deactivate a volunteer
router.patch('/volunteers/:id/status', (req, res, next) => {
  volunteerController.updateVolunteerStatus(req, res, next);
});

export default router;
