import { SchemaRepository } from './schema.repository';
import { GeneratorFactory, DatabaseType } from './generators/generator.factory';

export class SchemaService {
  private repository: SchemaRepository;

  constructor() {
    this.repository = new SchemaRepository();
  }

  /**
   * Orchestrates reading the schema metadata and using dialect factories 
   * to generate CREATE TABLE scripts.
   */
  async generateSchema(importId: string, databaseType: DatabaseType, tableName: string) {
    if (!databaseType || !tableName) {
      throw new Error('databaseType and tableName are required fields');
    }

    // 1. Fetch analyzed columns from DB
    const columns = await this.repository.getColumnsForImport(importId);
    if (!columns || columns.length === 0) {
      throw new Error('No columns found for this import. Please run detection first.');
    }

    // 2. Select specific Database dialet SQL Generator 
    const generator = GeneratorFactory.getGenerator(databaseType);

    // 3. Output raw clean SQL DDL script
    const sqlScript = generator.generateCreateTable(tableName, columns);

    // 4. Archive generated script inside database reference
    await this.repository.saveGeneratedSchema(importId, databaseType, tableName, sqlScript);

    // 5. Return payload shape expected by controller
    return {
      sql: sqlScript,
    };
  }
}
