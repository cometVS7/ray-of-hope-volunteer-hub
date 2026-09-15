import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public login route
router.post('/login', (req, res, next) => {
  authController.login(req, res, next);
});

// Protected current user profile route
router.get('/me', authenticate, (req, res, next) => {
  authController.getMe(req, res, next);
});

export default router;
