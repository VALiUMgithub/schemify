import { ISqlGenerator, ExecutionOptions } from './generator.interface';
import { ParsedColumn } from '@prisma/client';
import { resolveMysqlType } from './type-mapper';

export class MysqlGenerator implements ISqlGenerator {
  generateCreateTable(tableName: string, columns: ParsedColumn[], options?: ExecutionOptions): string {
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const ifNotExists = options?.ifNotExists ? ' IF NOT EXISTS' : '';
    
    let sql = '';

    if (options?.dropIfExists) {
      sql += `DROP TABLE IF EXISTS \`${safeTableName}\`;\n\n`;
    }
    
    sql += `CREATE TABLE${ifNotExists} \`${safeTableName}\` (\n`;
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
