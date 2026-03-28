import { ISqlGenerator } from './generator.interface';
import { ParsedColumn } from '@prisma/client';
import { resolveMysqlType } from './type-mapper';

export class MysqlGenerator implements ISqlGenerator {
  generateCreateTable(tableName: string, columns: ParsedColumn[]): string {
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    let sql = `CREATE TABLE \`${safeTableName}\` (\n`;
    sql += `  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n`;

    const columnDefs = columns.map(col => {
      const safeName = col.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const dbType = resolveMysqlType(col.detectedType);

      const nullability = col.nullable ? ' NULL' : ' NOT NULL';
      
      return `  \`${safeName}\` ${dbType}${nullability}`;
    });

    sql += columnDefs.join(',\n');
    sql += `\n);`;

    return sql;
  }
}
