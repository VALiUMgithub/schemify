import { ParsedColumn } from '@prisma/client';

export interface ISqlGenerator {
  /**
   * Generates a complete CREATE TABLE SQL statement for the specific database dialect
   */
  generateCreateTable(tableName: string, columns: ParsedColumn[]): string;
}
