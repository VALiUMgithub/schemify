// apps/api/src/modules/database/database.routes.ts
import { Router } from 'express';
import { DatabaseController } from './database.controller';

const router = Router();

// POST /api/database/test-connection - test database connectivity
router.post('/test-connection', DatabaseController.testConnection);

// GET /api/database/:importJobId/executions - get history of executions
router.get('/:importJobId/executions', DatabaseController.getExecutions);

// POST /api/database/:importJobId/execute - physical connection string logic to remote tables
router.post('/:importJobId/execute', DatabaseController.execute);

export default router;
