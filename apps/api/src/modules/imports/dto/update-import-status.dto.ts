import { ImportJobStatus } from '@prisma/client';

export interface UpdateImportStatusDto {
  status: ImportJobStatus;
}
