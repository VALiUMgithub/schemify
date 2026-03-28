import { detectColumnType, detectNullable } from './type-detector';
import { ParserFactory } from '../parsers/parser.factory';
import { ImportsRepository } from '../imports.repository';

// Interface linking the internal processing state
interface DetectedColumnUpdate {
  columnId: string;
  name: string;
  detectedType: string;
  nullable: boolean;
}

export class DetectionService {
  private repository: ImportsRepository;

  constructor() {
    this.repository = new ImportsRepository();
  }

  /**
   * Orchestrates the inference of Datatypes based on previously uploaded file data.
   */
  async detectSchema(importId: string) {
    // 1. Fetch import job and associated ParsedColumn rows from DB
    const importJob = await this.repository.getImportById(importId);
    
    if (!importJob) throw new Error('Import Job not found');
    if (!importJob.filePath) throw new Error('Import Job has no associated file');
    if (!importJob.columns || importJob.columns.length === 0) {
      throw new Error('No basic columns found. Did you run the parser first?');
    }

    // 2. Parse the file completely (or at least enough rows) to get column values
    // Memory Note: For massive files this logic might need streaming chunks, 
    // but the current parser limits previews to a manageable size anyway.
    const parser = ParserFactory.getParser(importJob.filePath);
    const parsedData = await parser.parse(importJob.filePath);
    
    const rows = parsedData.rowsPreview;

    // 3. For each known column, aggregate its values from all rows and infer type
    const detectionUpdates: DetectedColumnUpdate[] = [];

    for (const col of importJob.columns) {
      const columnValues = rows.map(row => row[col.name]);
      
      const inferredType = detectColumnType(columnValues);
      const isNullable = detectNullable(columnValues);

      detectionUpdates.push({
        columnId: col.id,
        name: col.name,
        detectedType: inferredType,
        nullable: isNullable
      });
    }

    // 4. Update the ParsedColumn records in the DB with the intelligence
    await this.repository.updateDetectedTypes(importId, detectionUpdates);

    // 5. Build and return the structured response
    return {
      columns: detectionUpdates.map(u => ({
        id: u.columnId,
        name: u.name,
        type: u.detectedType,
        nullable: u.nullable
      }))
    };
  }
}
