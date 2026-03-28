import { ImportsRepository } from './imports.repository';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportStatusDto } from './dto/update-import-status.dto';
import { ParserFactory } from './parsers/parser.factory';
import { ImportJobStatus } from '@prisma/client';

export class ImportsService {
  private repository: ImportsRepository;

  constructor() {
    this.repository = new ImportsRepository();
  }

  async createImport(data: CreateImportDto) {
    if (!data.projectId || !data.fileName || !data.filePath) {
      throw new Error('projectId, fileName, and filePath are required');
    }
    
    return await this.repository.createImport(data);
  }

  /**
   * Translates an Express.Multer.File object into a new ImportJob record
   */
  async createImportFromUpload(projectId: string, file: Express.Multer.File) {
    if (!projectId) throw new Error('projectId is required');
    if (!file) throw new Error('file is required');

    const dto: CreateImportDto = {
      projectId,
      fileName: file.originalname,
      filePath: file.path, 
      fileSize: file.size,
    };

    return await this.repository.createImport(dto);
  }

  async listImports(projectId?: string) {
    return await this.repository.getImports(projectId);
  }

  async getImport(id: string) {
    const importJob = await this.repository.getImportById(id);
    if (!importJob) throw new Error('Import Job not found');
    return importJob;
  }

  async updateStatus(id: string, data: UpdateImportStatusDto) {
    if (!data.status) {
      throw new Error('Status is required');
    }
    return await this.repository.updateImportStatus(id, data.status);
  }

  async deleteImport(id: string) {
    return await this.repository.deleteImport(id);
  }

  /**
   * Orchestrates the parsing of an uploaded file.
   * 1. Finds the import by ID to get the file path.
   * 2. Uses appropriate parser based on file type.
   * 3. Saves columns to the database.
   * 4. Updates ImportJob status to PROCESSING.
   */
  async parseImport(id: string) {
    // 1. Find the import job
    const importJob = await this.repository.getImportById(id);
    if (!importJob) {
      throw new Error('Import Job not found');
    }

    if (!importJob.filePath) {
      throw new Error('No file path associated with this import job');
    }

    // 2. Route to the correct parser natively based on extension
    const parser = ParserFactory.getParser(importJob.filePath);

    // Update status to processing while work is happening (useful if made async later)
    await this.updateStatus(id, { status: ImportJobStatus.PROCESSING });

    // 3. Perform the actual parsing
    const parsedData = await parser.parse(importJob.filePath);

    // 4. Store parsed columns in the database
    await this.repository.saveParsedColumns(id, parsedData.columns);

    // 5. Optionally revert or advance status (We'll leave it processing/schema_generated)
    // For now we set it to SCHEMA_GENERATED indicating parsing is complete
    await this.updateStatus(id, { status: ImportJobStatus.SCHEMA_GENERATED });

    // 6. Return columns and the 20-row preview payload back to the client
    return parsedData;
  }

  async updateColumns(importId: string, updates: { columnId: string, detectedType: string, nullable: boolean, name?: string }[]) {
    // 1. Optionally check if importJob exists
    const importJob = await this.repository.getImportById(importId);
    if (!importJob) {
      throw new Error('Import Job not found');
    }
    // 2. Perform updates
    await this.repository.updateDetectedTypes(importId, updates);
  }
}
