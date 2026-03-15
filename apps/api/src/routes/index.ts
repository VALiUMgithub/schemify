import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import projectRoutes from '../modules/projects/projects.routes';
import importRoutes from '../modules/imports/imports.routes';

const router = Router();

// Register the health check endpoint
router.get('/health', healthCheck);

// Register module-specific routes
router.use('/projects', projectRoutes);
router.use('/imports', importRoutes);

export default router;
