import { prisma } from '../../config/prisma';
import { CreateImportDto } from './dto/create-import.dto';
import { ImportJobStatus } from '@prisma/client';
import { ParsedColumnData } from './parsers/parser.interface';

export class ImportsRepository {
  async createImport(data: CreateImportDto) {
    return await prisma.importJob.create({
      data: {
        projectId: data.projectId,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        status: ImportJobStatus.UPLOADED, // Default status
      },
    });
  }

  async getImports(projectId?: string) {
    // If a projectId is provided, we can filter by it
    return await prisma.importJob.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { columns: true }, // Include parsed columns
    });
  }

  async getImportById(id: string) {
    return await prisma.importJob.findUnique({
      where: { id },
      include: { columns: true }, // Include parsed columns
    });
  }

  async updateImportStatus(id: string, status: ImportJobStatus) {
    return await prisma.importJob.update({
      where: { id },
      data: { status },
    });
  }

  async deleteImport(id: string) {
    return await prisma.importJob.delete({
      where: { id },
    });
  }

  /**
   * Deletes any old columns for this import, then saves the new generated ones
   */
  async saveParsedColumns(importJobId: string, columns: ParsedColumnData[]) {
    // Transaction wrapper to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // 1. Wipe existing columns in case of a re-parse
      await tx.parsedColumn.deleteMany({
        where: { importJobId }
      });

      // 2. Insert new columns
      if (columns.length > 0) {
        await tx.parsedColumn.createMany({
          data: columns.map(col => ({
            importJobId,
            name: col.name,
            sampleValue: col.sampleValue,
            order: col.order,
            // 'detectedType' and 'nullable' use defaults from Prisma schema ("VARCHAR", true)
          })),
        });
      }
    });
  }

  /**
   * Bulk updates the detected column attributes to the parsed columns
   */
  async updateDetectedTypes(importJobId: string, updates: { columnId: string, detectedType: string, nullable: boolean, name?: string }[]) {
    return await prisma.$transaction(async (tx) => {
      // Execute each update concurrently
      const updatePromises = updates.map(update => {
        const data: any = {
          detectedType: update.detectedType,
          nullable: update.nullable
        };
        if (update.name) data.name = update.name;

        return tx.parsedColumn.update({
          where: { id: update.columnId, importJobId }, // Safety scope via importJobId
          data
        });
      });
      await Promise.all(updatePromises);
    });
  }
}
