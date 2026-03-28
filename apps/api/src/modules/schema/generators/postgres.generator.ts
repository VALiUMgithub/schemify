import { ISqlGenerator } from './generator.interface';
import { ParsedColumn } from '@prisma/client';
import { resolvePostgresType } from './type-mapper';

export class PostgresGenerator implements ISqlGenerator {
  generateCreateTable(tableName: string, columns: ParsedColumn[]): string {
    // Basic sanitization: replace spaces and hyphens with underscores
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    let sql = `CREATE TABLE "${safeTableName}" (\n`;
    
    // Auto-generate an ID column by default
    sql += `  "id" SERIAL PRIMARY KEY,\n`;

    const columnDefs = columns.map(col => {
      const safeName = col.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const dbType = resolvePostgresType(col.detectedType);

      const nullability = col.nullable ? '' : ' NOT NULL';
      
      return `  "${safeName}" ${dbType}${nullability}`;
    });

    sql += columnDefs.join(',\n');
    sql += `\n);`;

    return sql;
  }
}
