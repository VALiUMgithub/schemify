import { ISqlGenerator } from './generator.interface';
import { ParsedColumn } from '@prisma/client';
import { resolveMssqlType } from './type-mapper';

export class MssqlGenerator implements ISqlGenerator {
  generateCreateTable(tableName: string, columns: ParsedColumn[]): string {
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    let sql = `CREATE TABLE [${safeTableName}] (\n`;
    sql += `  [id] INT IDENTITY(1,1) PRIMARY KEY,\n`;

    const columnDefs = columns.map(col => {
      const safeName = col.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const dbType = resolveMssqlType(col.detectedType);

      const nullability = col.nullable ? ' NULL' : ' NOT NULL';
      
      return `  [${safeName}] ${dbType}${nullability}`;
    });

    sql += columnDefs.join(',\n');
    sql += `\n);`;

    return sql;
  }
}
