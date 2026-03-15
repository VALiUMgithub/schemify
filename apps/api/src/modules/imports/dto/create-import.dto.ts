export interface CreateImportDto {
  projectId: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
}
