// ─── Enums ────────────────────────────────────────────────────────────────────

export type ImportStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "SCHEMA_GENERATED"
  | "READY"
  | "FAILED";

export type ColumnType =
  | "VARCHAR"
  | "INTEGER"
  | "BIGINT"
  | "FLOAT"
  | "BOOLEAN"
  | "DATE"
  | "TIMESTAMP"
  | "TEXT"
  | "UUID"
  | "JSONB";

export type DatabaseType = "POSTGRESQL" | "MYSQL" | "SQLITE";

export type ExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

// ─── Models ───────────────────────────────────────────────────────────────────

/**
 * A single column parsed from the uploaded file.
 * Matches the Prisma `ParsedColumn` model.
 */
export interface ParsedColumn {
  id: string;
  importJobId: string;
  name: string;
  detectedType: ColumnType;
  nullable: boolean;
  sampleValue: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * A generated SQL schema for a specific database target.
 * Matches the Prisma `GeneratedSchema` model.
 */
export interface GeneratedSchema {
  id: string;
  importJobId: string;
  databaseType: DatabaseType;
  tableName: string;
  sqlScript: string;
  createdAt: string;
}

/**
 * Result of executing a schema against an external database.
 * Matches the Prisma `ExecutionJob` model.
 */
export interface ExecutionJob {
  id: string;
  importJobId: string;
  databaseType: DatabaseType;
  status: ExecutionStatus;
  rowsInserted: number;
  errorMessage: string | null;
  executedAt: string;
}

/**
 * An import job ties an uploaded file to its parsed columns,
 * generated schemas, and execution results.
 * Matches the Prisma `ImportJob` model.
 */
export interface ImportJob {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  status: ImportStatus;
  createdAt: string;
  updatedAt: string;
  parsedColumns?: ParsedColumn[];
  generatedSchemas?: GeneratedSchema[];
  executionJobs?: ExecutionJob[];
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateImportJobPayload {
  projectId: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
}

export interface GenerateSchemaPayload {
  databaseType: DatabaseType;
  tableName: string;
}

export interface ExecuteDatabasePayload {
  databaseType: DatabaseType;
  config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
}
