import { ISqlGenerator, ExecutionOptions } from './generator.interface';
import { ParsedColumn } from '@prisma/client';
import { resolvePostgresType } from './type-mapper';

export class PostgresGenerator implements ISqlGenerator {
  generateCreateTable(tableName: string, columns: ParsedColumn[], options?: ExecutionOptions): string {
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const ifNotExists = options?.ifNotExists ? ' IF NOT EXISTS' : '';
    
    let sql = '';

    if (options?.dropIfExists) {
      sql += `DROP TABLE IF EXISTS "${safeTableName}";\n\n`;
    }
    
    sql += `CREATE TABLE${ifNotExists} "${safeTableName}" (\n`;
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
