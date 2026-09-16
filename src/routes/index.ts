import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import adminRouter from './admin.routes.js';
import volunteerRouter from './volunteer.routes.js';

const router = Router();

// Mount routes
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/volunteer', volunteerRouter);

export default router;

