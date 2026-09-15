import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      status: 'UP',
      service: 'ray-of-hope-volunteer-hub',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    'Service is healthy'
  );
});

export default router;
