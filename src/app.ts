import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { NotFoundError } from './utils/app-error.js';

export const createApp = (): Express => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: ENV.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root endpoint info
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'A Ray of Hope — Volunteer Management System API',
      status: 'online',
      documentation: '/api/health',
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // 404 Handler for undefined routes
  app.use((req: Request, _res: Response, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
