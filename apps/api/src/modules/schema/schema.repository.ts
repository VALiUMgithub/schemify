import { prisma } from '../../config/prisma';

export class SchemaRepository {
  /**
   * Retrieves the raw parsed columns needed for schema generation 
   */
  async getColumnsForImport(importJobId: string) {
    return await prisma.parsedColumn.findMany({
      where: { importJobId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Saves the generated raw SQL string to the database for this import job
   */
  async saveGeneratedSchema(importJobId: string, databaseType: string, tableName: string, sqlScript: string) {
    return await prisma.generatedSchema.create({
      data: {
        importJobId,
        databaseType,
        tableName,
        sqlScript,
      },
    });
  }
}