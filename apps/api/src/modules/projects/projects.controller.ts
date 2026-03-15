import { Request, Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service';
import { ResponseUtil } from '../../utils/api-response';

const projectsService = new ProjectsService();

export class ProjectsController {
  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.createProject(req.body);
      return ResponseUtil.success(res, project, 'Project created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectsService.listProjects();
      return ResponseUtil.success(res, projects, 'Projects retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.getProject(req.params.id);
      return ResponseUtil.success(res, project, 'Project retrieved successfully');
    } catch (error) {
      next(error); // This will pass the 'Project not found' to our global error handler
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.updateProject(req.params.id, req.body);
      return ResponseUtil.success(res, project, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      await projectsService.deleteProject(req.params.id);
      return ResponseUtil.success(res, null, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
