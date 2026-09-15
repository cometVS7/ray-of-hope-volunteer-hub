import { Router } from 'express';
import healthRouter from './health.routes.js';

const router = Router();

// Mount health check at /api/health
router.use('/health', healthRouter);

export default router;
