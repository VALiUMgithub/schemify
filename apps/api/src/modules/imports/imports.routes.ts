import { Router } from 'express';
import { ImportsController } from './imports.controller';
import { uploadMiddleware } from '../../middleware/upload.middleware';

const router = Router();
const controller = new ImportsController();

// Add the single file upload middleware to the upload route
router.post('/upload', uploadMiddleware.single('file'), controller.uploadImport.bind(controller));

// Standard CRUD endpoints
router.post('/', controller.createImport.bind(controller));
router.get('/', controller.getImports.bind(controller));
router.get('/:id', controller.getImport.bind(controller));
router.post('/:id/parse', controller.parseImport.bind(controller));
router.post('/:id/detect-schema', controller.detectSchema.bind(controller));
router.patch('/:id/columns', controller.updateColumns.bind(controller));
router.patch('/:id/status', controller.updateImportStatus.bind(controller));
router.delete('/:id', controller.deleteImport.bind(controller));

export default router;
