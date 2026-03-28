import { Router } from 'express';
import { SchemaController } from './schema.controller';

const router = Router();
const controller = new SchemaController();

// POST /schema/generate/:importId
router.post('/generate/:importId', controller.generateSchema.bind(controller));

// Future Routes could go here
// router.get('/:importId', controller.getGeneratedSchemas.bind(controller));

export default router;