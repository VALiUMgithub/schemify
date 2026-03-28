// apps/api/src/modules/database/database.controller.ts
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from './database.service';
import { ResponseUtil } from '../../utils/api-response';

export class DatabaseController {
  static async execute(req: Request, res: Response, next: NextFunction) {
    try {
      const { importJobId } = req.params;
      const { databaseType, config } = req.body;

      if (!databaseType || !config) {
        return res.status(400).json({ error: 'databaseType and target connection config are required' });
      }

      const result = await DatabaseService.executeJob(importJobId, databaseType, config);

      return ResponseUtil.success(res, { result }, 'Execution completed successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getExecutions(req: Request, res: Response, next: NextFunction) {
    try {
      const { importJobId } = req.params;
      const executions = await DatabaseService.getExecutions(importJobId);

      return ResponseUtil.success(res, { executions }, 'Retrieved execution history successfully.');
    } catch (error) {
      next(error);
    }
  }
}
