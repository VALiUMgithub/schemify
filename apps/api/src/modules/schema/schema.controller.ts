import { Request, Response, NextFunction } from 'express';
import { SchemaService } from './schema.service';
import { ResponseUtil } from '../../utils/api-response';

const schemaService = new SchemaService();

export class SchemaController {
  
  /**
   * Endpoint to execute SQL schema generation against a specific importJob
   */
  async generateSchema(req: Request, res: Response, next: NextFunction) {
    try {
      const importId = req.params.importId;
      const { databaseType, tableName } = req.body;

      const generatedResult = await schemaService.generateSchema(importId, databaseType, tableName);
      
      return ResponseUtil.success(res, generatedResult, 'SQL Schema generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}