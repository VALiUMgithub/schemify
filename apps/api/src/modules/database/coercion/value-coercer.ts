// apps/api/src/modules/database/coercion/value-coercer.ts

/**
 * Value coercion layer for transforming parsed data values
 * to match target database column types.
 */

export interface ColumnTypeInfo {
  name: string;
  detectedType: string;
  nullable: boolean;
}

export interface CoercionContext {
  databaseType: string; // 'postgres', 'mysql', 'mssql'
}

export interface CoercionResult {
  value: any;
  wasCoerced: boolean;
}

/**
 * Coerce a single value based on target column type
 */
export function coerceValue(
  value: unknown,
  columnType: string,
  context: CoercionContext
): any {
  // Handle NULL/undefined
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = String(value);
  const baseType = extractBaseType(columnType);

  // Boolean coercion
  if (baseType === 'BOOLEAN' || baseType === 'BIT') {
    return coerceBoolean(stringValue, context);
  }

  // Date/Timestamp coercion
  if (baseType === 'DATE') {
    return coerceDate(stringValue);
  }

  if (baseType === 'TIMESTAMP' || baseType === 'DATETIME' || baseType === 'DATETIME2') {
    return coerceTimestamp(stringValue, context);
  }

  // Integer coercion - empty string to null
  if (baseType === 'INT' || baseType === 'INTEGER' || baseType === 'BIGINT' || baseType === 'SMALLINT') {
    if (stringValue.trim() === '') {
      return null;
    }
    const parsed = parseInt(stringValue, 10);
    return isNaN(parsed) ? null : parsed;
  }

  // Float/Decimal coercion - empty string to null
  if (baseType === 'FLOAT' || baseType === 'DOUBLE' || baseType === 'DECIMAL' || baseType === 'NUMERIC' || baseType === 'REAL') {
    if (stringValue.trim() === '') {
      return null;
    }
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? null : parsed;
  }

  // Default: return as-is (strings, etc.)
  return value;
}

/**
 * Extract base type from type string (e.g., "VARCHAR(255)" -> "VARCHAR")
 */
function extractBaseType(typeString: string): string {
  const match = typeString.match(/^([A-Z]+)/i);
  return match ? match[1].toUpperCase() : typeString.toUpperCase();
}

/**
 * Coerce string value to boolean
 */
function coerceBoolean(value: string, context: CoercionContext): boolean | null {
  const trimmed = value.trim();
  
  // Empty string -> null
  if (trimmed === '') {
    return null;
  }

  const lower = trimmed.toLowerCase();

  // Truthy values
  if (['true', '1', 't', 'yes', 'y'].includes(lower)) {
    return true;
  }

  // Falsy values
  if (['false', '0', 'f', 'no', 'n'].includes(lower)) {
    return false;
  }

  // Unrecognized value - treat as null to avoid errors
  // This is a graceful fallback; the original detection should have caught this
  return null;
}

/**
 * Coerce string value to date (YYYY-MM-DD format)
 */
function coerceDate(value: string): string | null {
  const trimmed = value.trim();
  
  if (trimmed === '') {
    return null;
  }

  // Try parsing as date
  const date = parseFlexibleDate(trimmed);
  if (!date) {
    return null;
  }

  // Return ISO date format (YYYY-MM-DD)
  return formatISODate(date);
}

/**
 * Coerce string value to timestamp (ISO 8601 format)
 */
function coerceTimestamp(value: string, context: CoercionContext): string | Date | null {
  const trimmed = value.trim();
  
  if (trimmed === '') {
    return null;
  }

  // Try parsing as date/time
  const date = parseFlexibleDate(trimmed);
  if (!date) {
    return null;
  }

  // For MSSQL, return Date object directly (driver handles it better)
  if (context.databaseType === 'mssql') {
    return date;
  }

  // For PostgreSQL and MySQL, return ISO string without timezone suffix
  // This avoids timezone parsing issues
  return formatISOTimestamp(date);
}

/**
 * Parse date from various formats
 */
function parseFlexibleDate(value: string): Date | null {
  // Handle common date formats
  const trimmed = value.trim();
  
  // Try standard Date parsing first
  let date = new Date(trimmed);
  
  // If invalid, try some common formats
  if (isNaN(date.getTime())) {
    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      date = new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`);
    }
    
    // MM/DD/YYYY
    const mdyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s/);
    if (isNaN(date.getTime()) && mdyMatch) {
      date = new Date(`${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`);
    }
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format timestamp as YYYY-MM-DD HH:MM:SS (no timezone)
 */
function formatISOTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Coerce an entire row of values based on column types
 */
export function coerceRow(
  row: unknown[],
  columns: ColumnTypeInfo[],
  context: CoercionContext
): unknown[] {
  return row.map((value, index) => {
    const column = columns[index];
    if (!column) {
      return value;
    }
    return coerceValue(value, column.detectedType, context);
  });
}

/**
 * Coerce all rows in a dataset
 */
export function coerceRows(
  rows: unknown[][],
  columns: ColumnTypeInfo[],
  context: CoercionContext
): unknown[][] {
  return rows.map(row => coerceRow(row, columns, context));
}
