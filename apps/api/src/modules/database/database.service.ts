// apps/api/src/modules/database/database.service.ts
import { ParsedColumn, PrismaClient } from '@prisma/client';
import { DatabaseAdapterFactory } from './adapters/adapter.factory';
import { DatabaseConfiguration } from './adapters/strategy.interface';
import { ParserFactory } from '../imports/parsers/parser.factory';
import { GeneratorFactory, DatabaseType } from '../schema/generators/generator.factory';
import { ExecutionOptions } from '../schema/generators/generator.interface';
import { parseColumnTypeSpec } from '../schema/generators/type-mapper';
import { coerceRows, ColumnTypeInfo } from './coercion/value-coercer';
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

function mapExecutionError(error: unknown, databaseType?: string): ServiceError {
  const err = error as ServiceError;
  const rawMessage = err?.message ?? 'Execution failed.';

  // === MSSQL Errors ===
  
  // NULL constraint violation (MSSQL)
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

  // String truncation (MSSQL)
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

  // Type conversion error (MSSQL) - e.g., "Conversion failed when converting the nvarchar value 'Y' to data type bit"
  const mssqlTypeConversionMatch = rawMessage.match(/Conversion failed when converting.*value '([^']+)'.*to data type (\w+)/i);
  if (mssqlTypeConversionMatch) {
    const value = mssqlTypeConversionMatch[1];
    const targetType = mssqlTypeConversionMatch[2];
    return createServiceError(
      `Type conversion error: Cannot convert value '${value}' to ${targetType}. Check your data for invalid values or change the column type.`,
      400,
      'EXECUTION_TYPE_CONVERSION_ERROR',
      { value, targetType }
    );
  }

  // === PostgreSQL Errors ===

  // Invalid boolean syntax (PostgreSQL)
  const postgresBooleanMatch = rawMessage.match(/invalid input syntax for type boolean: "([^"]*)"/i);
  if (postgresBooleanMatch) {
    const value = postgresBooleanMatch[1];
    return createServiceError(
      `Invalid boolean value: "${value}". Boolean columns accept: true, false, yes, no, 1, 0, y, n. Empty values should be in nullable columns.`,
      400,
      'EXECUTION_INVALID_BOOLEAN',
      { value }
    );
  }

  // Invalid integer syntax (PostgreSQL)
  const postgresIntegerMatch = rawMessage.match(/invalid input syntax for type integer: "([^"]*)"/i);
  if (postgresIntegerMatch) {
    const value = postgresIntegerMatch[1];
    return createServiceError(
      `Invalid integer value: "${value}". Integer columns only accept numeric values. Empty values should be in nullable columns.`,
      400,
      'EXECUTION_INVALID_INTEGER',
      { value }
    );
  }

  // Invalid date syntax (PostgreSQL)
  const postgresDateMatch = rawMessage.match(/invalid input syntax for type (date|timestamp).*: "([^"]*)"/i);
  if (postgresDateMatch) {
    const dateType = postgresDateMatch[1];
    const value = postgresDateMatch[2];
    return createServiceError(
      `Invalid ${dateType} value: "${value}". Use ISO 8601 format (YYYY-MM-DD) or ensure empty values are in nullable columns.`,
      400,
      'EXECUTION_INVALID_DATE',
      { value, dateType }
    );
  }

  // Timezone error (PostgreSQL)
  const postgresTimezoneMatch = rawMessage.match(/time zone "([^"]+)" not recognized/i);
  if (postgresTimezoneMatch) {
    const timezone = postgresTimezoneMatch[1];
    return createServiceError(
      `Invalid timezone: "${timezone}". The date/time value contains an unrecognized timezone. Try using UTC or standard timezone names.`,
      400,
      'EXECUTION_INVALID_TIMEZONE',
      { timezone }
    );
  }

  // Parameter binding error (PostgreSQL) - often happens with large datasets
  const postgresParamMatch = rawMessage.match(/bind message has (\d+) parameter formats but (\d+) parameters/i);
  if (postgresParamMatch) {
    return createServiceError(
      `Database parameter limit exceeded. The dataset is too large for a single insert operation. This is being handled automatically with batched inserts.`,
      400,
      'EXECUTION_PARAMETER_LIMIT',
      { expected: postgresParamMatch[1], actual: postgresParamMatch[2] }
    );
  }

  // Value too long (PostgreSQL)
  const postgresValueTooLongMatch = rawMessage.match(/value too long for type character varying\((\d+)\)/i);
  if (postgresValueTooLongMatch) {
    const maxLength = postgresValueTooLongMatch[1];
    return createServiceError(
      `Value exceeds column size limit of ${maxLength} characters. Increase the column size or truncate the data.`,
      400,
      'EXECUTION_SIZE_VIOLATION',
      { maxLength }
    );
  }

  // NULL constraint (PostgreSQL)
  const postgresNullMatch = rawMessage.match(/null value in column "([^"]+)" .*violates not-null constraint/i);
  if (postgresNullMatch) {
    const columnName = postgresNullMatch[1];
    return createServiceError(
      `Column '${columnName}' is set to NOT NULL but contains empty or null values. Mark the column as nullable or clean the source data.`,
      400,
      'EXECUTION_NOT_NULL_VIOLATION',
      { column: columnName }
    );
  }

  // === MySQL Errors ===

  // Incorrect value for column (MySQL)
  const mysqlIncorrectMatch = rawMessage.match(/Incorrect (\w+) value: '([^']*)' for column '([^']+)'/i);
  if (mysqlIncorrectMatch) {
    const dataType = mysqlIncorrectMatch[1];
    const value = mysqlIncorrectMatch[2];
    const column = mysqlIncorrectMatch[3];
    return createServiceError(
      `Invalid ${dataType} value '${value}' for column '${column}'. Check your data format or change the column type.`,
      400,
      'EXECUTION_TYPE_CONVERSION_ERROR',
      { dataType, value, column }
    );
  }

  // Data too long (MySQL)
  const mysqlDataTooLongMatch = rawMessage.match(/Data too long for column '([^']+)'/i);
  if (mysqlDataTooLongMatch) {
    const columnName = mysqlDataTooLongMatch[1];
    return createServiceError(
      `Data too long for column '${columnName}'. Increase the column size or truncate the data.`,
      400,
      'EXECUTION_SIZE_VIOLATION',
      { column: columnName }
    );
  }

  // Column cannot be null (MySQL)
  const mysqlNullMatch = rawMessage.match(/Column '([^']+)' cannot be null/i);
  if (mysqlNullMatch) {
    const columnName = mysqlNullMatch[1];
    return createServiceError(
      `Column '${columnName}' is set to NOT NULL but contains empty or null values. Mark the column as nullable or clean the source data.`,
      400,
      'EXECUTION_NOT_NULL_VIOLATION',
      { column: columnName }
    );
  }

  // === Generic table exists error ===
  const tableExistsMatch = rawMessage.match(/relation "([^"]+)" already exists/i) ||
                           rawMessage.match(/Table '([^']+)' already exists/i) ||
                           rawMessage.match(/There is already an object named '([^']+)'/i);
  if (tableExistsMatch) {
    const tableName = tableExistsMatch[1];
    return createServiceError(
      `Table '${tableName}' already exists. Use the "Drop existing table" or "Use IF NOT EXISTS" option to handle this.`,
      400,
      'EXECUTION_TABLE_EXISTS',
      { table: tableName }
    );
  }

  // If no specific pattern matched, return a more helpful generic error
  if (err.statusCode) {
    return err;
  }

  // Wrap unknown errors with a user-friendly message
  return createServiceError(
    `Database execution failed: ${rawMessage}`,
    500,
    'EXECUTION_UNKNOWN_ERROR',
    { originalMessage: rawMessage }
  );
}

export class DatabaseService {
  /**
   * Execute the generated schema and insert parsed data
   */
  static async executeJob(
    importJobId: string,
    databaseType: string,
    config: DatabaseConfiguration,
    options?: ExecutionOptions
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
      const executionSql = generator.generateCreateTable(schemaDef.tableName, orderedColumns, options);
      await adapter.createTable(executionSql);

      // 6. Coerce row values to match target column types
      const columnTypeInfo: ColumnTypeInfo[] = orderedColumns.map(col => ({
        name: col.name,
        detectedType: col.detectedType,
        nullable: col.nullable,
      }));
      const coercedRows = coerceRows(rows, columnTypeInfo, { databaseType });

      // 7. Bulk Insert Rows
      const rowsInserted = await adapter.insertRows(safeTableName, columns, coercedRows);

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
      const mappedError = mapExecutionError(err, databaseType);

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

  /**
   * Test connection to a database without executing anything
   */
  static async testConnection(
    databaseType: string,
    config: DatabaseConfiguration
  ) {
    const adapter = DatabaseAdapterFactory.getAdapter(databaseType);
    return adapter.testConnection(config);
  }
}
