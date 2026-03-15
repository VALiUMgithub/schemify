import { Router } from 'express';
import { ProjectsController } from './projects.controller';

const router = Router();
const controller = new ProjectsController();

// Note: Ensure functions are bound or use arrow functions if "this" context is lost.
// Here we are simply using instance methods that don't rely heavily on "this" state, 
// but it's good practice to bind them if they do:
router.post('/', controller.createProject.bind(controller));
router.get('/', controller.getProjects.bind(controller));
router.get('/:id', controller.getProject.bind(controller));
router.patch('/:id', controller.updateProject.bind(controller));
router.delete('/:id', controller.deleteProject.bind(controller));

export default router;
