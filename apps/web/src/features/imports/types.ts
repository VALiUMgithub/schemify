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

export type DatabaseEngine = "postgres" | "mysql" | "mssql";

export type ExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

// ─── Models ───────────────────────────────────────────────────────────────────

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

export interface GeneratedSchema {
  id: string;
  importJobId: string;
  databaseType: string;
  tableName: string;
  sqlScript: string;
  createdAt: string;
}

export interface ExecutionJob {
  id: string;
  importJobId: string;
  databaseType: string;
  status: ExecutionStatus;
  rowsInserted: number;
  errorMessage: string | null;
  executedAt: string;
}

export interface ImportJob {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  status: ImportStatus;
  createdAt: string;
  updatedAt: string;
  columns?: ParsedColumn[];
  schemas?: GeneratedSchema[];
  executions?: ExecutionJob[];
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateImportJobPayload {
  projectId: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
}

export interface GenerateSchemaPayload {
  databaseType: DatabaseEngine;
  tableName: string;
}

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface ExecuteDatabasePayload {
  databaseType: DatabaseEngine;
  config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}
