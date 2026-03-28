import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import projectRoutes from '../modules/projects/projects.routes';
import importRoutes from '../modules/imports/imports.routes';
import schemaRoutes from '../modules/schema/schema.routes';
import databaseRoutes from '../modules/database/database.routes';

const router = Router();

// Register the health check endpoint
router.get('/health', healthCheck);

// Register module-specific routes
router.use('/projects', projectRoutes);
router.use('/imports', importRoutes);
router.use('/schema', schemaRoutes);
router.use('/database', databaseRoutes);

export default router;
