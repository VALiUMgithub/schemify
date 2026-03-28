// apps/api/src/modules/database/database.service.ts
import { ParsedColumn, PrismaClient } from '@prisma/client';
import { DatabaseAdapterFactory } from './adapters/adapter.factory';
import { DatabaseConfiguration } from './adapters/strategy.interface';
import { ParserFactory } from '../imports/parsers/parser.factory';
import { GeneratorFactory, DatabaseType } from '../schema/generators/generator.factory';
import { parseColumnTypeSpec } from '../schema/generators/type-mapper';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type ServiceError = Error & {
  statusCode?: number;
  code?: string;
  details?: unknown;
};

function createServiceError(
  message: string,
  statusCode: number,
  code: string,
  details?: unknown
): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

function normalizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function inferStringTypeForExecution(
  column: ParsedColumn,
  maxObservedLength: number,
  databaseType: string
): string {
  const spec = parseColumnTypeSpec(column.detectedType);
  if (spec.hasExplicitSize) {
    return column.detectedType;
  }

  const base = spec.base;
  if (base !== 'VARCHAR' && base !== 'NVARCHAR') {
    return column.detectedType;
  }

  if (maxObservedLength <= 0) {
    return column.detectedType;
  }

  const suggested = Math.max(255, maxObservedLength);

  if (databaseType === 'mssql') {
    if (base === 'NVARCHAR') {
      return suggested > 4000 ? 'NVARCHAR(MAX)' : `NVARCHAR(${suggested})`;
    }
    return suggested > 8000 ? 'VARCHAR(MAX)' : `VARCHAR(${suggested})`;
  }

  if (databaseType === 'mysql') {
    return suggested > 65535 ? 'TEXT' : `VARCHAR(${suggested})`;
  }

  return `VARCHAR(${suggested})`;
}

function validateExplicitStringSize(
  column: ParsedColumn,
  maxObservedLength: number,
  databaseType: string
): string | null {
  const spec = parseColumnTypeSpec(column.detectedType);

  if (!spec.hasExplicitSize || typeof spec.size !== 'number') {
    return null;
  }

  const base = spec.base;
  if (base !== 'VARCHAR' && base !== 'NVARCHAR') {
    return null;
  }

  if (databaseType === 'mssql') {
    const engineLimit = base === 'NVARCHAR' ? 4000 : 8000;
    if (spec.size > engineLimit) {
      return `${column.name}: ${base}(${spec.size}) exceeds SQL Server limit ${engineLimit}; use ${base}(MAX)`;
    }
  }

  if (maxObservedLength > spec.size) {
    return `${column.name}: max value length ${maxObservedLength} exceeds configured ${base}(${spec.size})`;
  }

  return null;
}

function isValueTreatedAsNull(value: unknown, databaseType: string): boolean {
  if (value === null || value === undefined) return true;
  if (databaseType === 'mssql' && typeof value === 'string' && value.trim() === '') {
    return true;
  }
  return false;
}

function validateNotNullColumns(
  columns: ParsedColumn[],
  rows: any[][],
  databaseType: string
): { column: string; rowNumber: number }[] {
  const violations: { column: string; rowNumber: number }[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const col = columns[colIndex];
      if (col.nullable) continue;

      if (isValueTreatedAsNull(row[colIndex], databaseType)) {
        // +2 because source files have a header row and then data rows start at line 2.
        violations.push({ column: col.name, rowNumber: rowIndex + 2 });
      }
    }
  }

  return violations;
}

function mapExecutionError(error: unknown): ServiceError {
  const err = error as ServiceError;
  const rawMessage = err?.message ?? 'Execution failed.';

  const nullColumnMatch = rawMessage.match(/Cannot insert the value NULL into column '([^']+)'/i);
  if (nullColumnMatch) {
    const columnName = nullColumnMatch[1];
    return createServiceError(
      `Column '${columnName}' is set to NOT NULL but one or more incoming rows contain empty or null values for this column. Update schema nullability or clean the source data and retry.`,
      400,
      'EXECUTION_NOT_NULL_VIOLATION',
      { column: columnName }
    );
  }

  const truncationMatch = rawMessage.match(/String or binary data would be truncated.*column '([^']+)'/i);
  if (truncationMatch) {
    const columnName = truncationMatch[1];
    return createServiceError(
      `Column '${columnName}' is too small for one or more values. Increase column size (or use MAX where supported) and retry.`,
      400,
      'EXECUTION_SIZE_VIOLATION',
      { column: columnName }
    );
  }

  return err;
}

export class DatabaseService {
  /**
   * Execute the generated schema and insert parsed data
   */
  static async executeJob(
    importJobId: string,
    databaseType: string,
    config: DatabaseConfiguration
  ): Promise<any> {
    // 1. Fetch Job and Schema Definition
    const job = await prisma.importJob.findUnique({
      where: { id: importJobId },
      include: {
        schemas: {
          where: { databaseType },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        columns: true,
      },
    });

    if (!job) throw new Error('Job not found');
    if (job.status !== 'SCHEMA_GENERATED' && job.status !== 'READY') {
      throw new Error(`Invalid status for execution: ${job.status}`);
    }
    
    const schemaDef = job.schemas[0];
    if (!schemaDef) throw new Error(`No generated schema found for ${databaseType}`);
    
    // 2. Register an ExecutionJob state
    const execution = await prisma.executionJob.create({
      data: {
        importJobId: job.id,
        databaseType,
        status: 'RUNNING',
      },
    });

    const adapter = DatabaseAdapterFactory.getAdapter(databaseType);

    try {
      // 3. Connect to target DB
      await adapter.connect(config);

      // 4. Parse source data and infer size-safe runtime column types.
      const parser = ParserFactory.getParser(job.fileName);
      const filePath = path.resolve(job.filePath);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Original file is missing, cannot extract rows');
      }

      const parsedData = await parser.parseAll(filePath);
      const rows = parsedData.rows;

      const baseOrderedColumns = [...job.columns].sort((a, b) => a.order - b.order);
      const maxObservedLengths = baseOrderedColumns.map((_, index) =>
        rows.reduce((maxLen, row) => {
          const value = row[index];
          if (value === null || value === undefined) return maxLen;
          const len = String(value).length;
          return len > maxLen ? len : maxLen;
        }, 0)
      );

      const sizeValidationErrors = baseOrderedColumns
        .map((col, index) => validateExplicitStringSize(col, maxObservedLengths[index], databaseType))
        .filter((msg): msg is string => Boolean(msg));

      if (sizeValidationErrors.length > 0) {
        throw createServiceError(
          `Schema validation failed before execution. Increase column sizes or use MAX to avoid data loss.`,
          400,
          'SCHEMA_SIZE_VALIDATION_FAILED',
          sizeValidationErrors
        );
      }

      const notNullViolations = validateNotNullColumns(baseOrderedColumns, rows, databaseType);
      if (notNullViolations.length > 0) {
        const sampleViolations = notNullViolations.slice(0, 10);
        throw createServiceError(
          'Schema validation failed before execution because NOT NULL columns contain empty/null source values.',
          400,
          'SCHEMA_NOT_NULL_VALIDATION_FAILED',
          {
            totalViolations: notNullViolations.length,
            sample: sampleViolations,
          }
        );
      }

      // Keep insertion order consistent with import parsing order.
      const orderedColumns = baseOrderedColumns.map((col, index) => {
        const maxObservedLength = maxObservedLengths[index];
        return {
          ...col,
          detectedType: inferStringTypeForExecution(col, maxObservedLength, databaseType),
        };
      });
      const columns = orderedColumns.map((col) => normalizeIdentifier(col.name));
      const safeTableName = normalizeIdentifier(schemaDef.tableName);

      if (columns.length === 0) {
        throw new Error('No parsed columns found for execution');
      }

      if (parsedData.headers.length !== columns.length) {
        throw new Error(
          `Column mismatch: file has ${parsedData.headers.length} headers but import metadata has ${columns.length} columns`
        );
      }

      // 5. Build execution DDL from latest column config to avoid stale schema drift.
      const generator = GeneratorFactory.getGenerator(databaseType as DatabaseType);
      const executionSql = generator.generateCreateTable(schemaDef.tableName, orderedColumns);
      await adapter.createTable(executionSql);

      // 6. Bulk Insert Rows
      const rowsInserted = await adapter.insertRows(safeTableName, columns, rows);

      // 7. Update status to Success on completion
      await prisma.executionJob.update({
        where: { id: execution.id },
        data: {
          status: 'SUCCESS',
          rowsInserted,
        },
      });

      // Update ImportJob status generally to READY indicating it's done executing somewhere
      await prisma.importJob.update({
        where: { id: job.id },
        data: { status: 'READY' }
      });

      return {
        executionId: execution.id,
        status: 'SUCCESS',
        rowsInserted,
      };
    } catch (err: any) {
      const mappedError = mapExecutionError(err);

      // Rollback status
      await prisma.executionJob.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: mappedError.message,
        },
      });

      throw mappedError;
    } finally {
      await adapter.disconnect();
    }
  }

  /**
   * Get executions for an ImportJob
   */
  static async getExecutions(importJobId: string) {
    return prisma.executionJob.findMany({
      where: { importJobId },
      orderBy: { executedAt: 'desc' },
    });
  }
}
