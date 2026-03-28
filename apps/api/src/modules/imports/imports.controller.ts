import { Request, Response, NextFunction } from 'express';
import { ImportsService } from './imports.service';
import { DetectionService } from './detection/detection.service';
import { ResponseUtil } from '../../utils/api-response';

const importsService = new ImportsService();
const detectionService = new DetectionService();

export class ImportsController {
  
  /**
   * Handles the multipart form-data upload, creates an ImportJob, 
   * and returns the tracking record.
   */
  async uploadImport(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const projectId = req.body.projectId;

      if (!file) {
        return ResponseUtil.error(res, 'No allowable file provided in request', 400);
      }
      if (!projectId) {
        return ResponseUtil.error(res, 'projectId is required in form-data payload', 400);
      }

      const importJob = await importsService.createImportFromUpload(projectId, file);
      
      return ResponseUtil.success(res, importJob, 'File uploaded and import job configured', 201);
    } catch (error) {
      next(error);
    }
  }

  async createImport(req: Request, res: Response, next: NextFunction) {
    try {
      const importJob = await importsService.createImport(req.body);
      return ResponseUtil.success(res, importJob, 'Import job created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getImports(req: Request, res: Response, next: NextFunction) {
    try {
      // Allow optional querying by projectId: /imports?projectId=xxx
      const projectId = req.query.projectId as string | undefined;
      const imports = await importsService.listImports(projectId);
      return ResponseUtil.success(res, imports, 'Import jobs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getImport(req: Request, res: Response, next: NextFunction) {
    try {
      const importJob = await importsService.getImport(req.params.id);
      return ResponseUtil.success(res, importJob, 'Import job retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateImportStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const importJob = await importsService.updateStatus(req.params.id, req.body);
      return ResponseUtil.success(res, importJob, 'Import job status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteImport(req: Request, res: Response, next: NextFunction) {
    try {
      await importsService.deleteImport(req.params.id);
      return ResponseUtil.success(res, null, 'Import job deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async parseImport(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = await importsService.parseImport(req.params.id);
      return ResponseUtil.success(res, parsedData, 'File parsed successfully');
    } catch (error) {
      next(error);
    }
  }

  async detectSchema(req: Request, res: Response, next: NextFunction) {
    try {
      const detectedSchema = await detectionService.detectSchema(req.params.id);
      return ResponseUtil.success(res, detectedSchema, 'Schema detected successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateColumns(req: Request, res: Response, next: NextFunction) {
    try {
      const { updates } = req.body;
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: 'updates array is required' });
      }
      await importsService.updateColumns(req.params.id, updates);
      return ResponseUtil.success(res, null, 'Columns updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
