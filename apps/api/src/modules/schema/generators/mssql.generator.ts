import { ISqlGenerator, ExecutionOptions } from './generator.interface';
import { ParsedColumn } from '@prisma/client';
import { resolveMssqlType } from './type-mapper';

export class MssqlGenerator implements ISqlGenerator {
  generateCreateTable(tableName: string, columns: ParsedColumn[], options?: ExecutionOptions): string {
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    let sql = '';

    if (options?.dropIfExists) {
      sql += `DROP TABLE IF EXISTS [${safeTableName}];\n\n`;
    }

    // SQL Server doesn't support CREATE TABLE IF NOT EXISTS directly
    // We use a conditional check with OBJECT_ID which is safer than string interpolation in WHERE clause
    if (options?.ifNotExists && !options?.dropIfExists) {
      sql += `IF OBJECT_ID(N'[dbo].[${safeTableName}]', N'U') IS NULL\n`;
      sql += `BEGIN\n`;
    }
    
    const indent = options?.ifNotExists && !options?.dropIfExists ? '  ' : '';
    
    sql += `${indent}CREATE TABLE [${safeTableName}] (\n`;
    sql += `${indent}  [id] INT IDENTITY(1,1) PRIMARY KEY,\n`;

    const columnDefs = columns.map(col => {
      const safeName = col.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const dbType = resolveMssqlType(col.detectedType);

      const nullability = col.nullable ? ' NULL' : ' NOT NULL';
      
      return `${indent}  [${safeName}] ${dbType}${nullability}`;
    });

    sql += columnDefs.join(',\n');
    sql += `\n${indent});`;

    if (options?.ifNotExists && !options?.dropIfExists) {
      sql += `\nEND`;
    }

    return sql;
  }
}
