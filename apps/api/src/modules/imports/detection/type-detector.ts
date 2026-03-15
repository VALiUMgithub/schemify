/**
 * Validates if an array of values should be considered strictly Integer.
 */
function isIntegerList(values: string[]): boolean {
  if (values.length === 0) return false;
  return values.every(value => {
    if (value === "") return true; // skip empties when detecting baseline numbers
    const num = Number(value);
    return Number.isInteger(num);
  });
}

/**
 * Validates if an array of values should be considered Decimal/Float.
 */
function isDecimalList(values: string[]): boolean {
  if (values.length === 0) return false;
  let hasDecimal = false;
  
  const isValid = values.every(value => {
    if (value === "") return true;
    const num = Number(value);
    if (isNaN(num)) return false;
    if (!Number.isInteger(num)) hasDecimal = true;
    return true;
  });

  return isValid && hasDecimal;
}

/**
 * Validates if values represent boolean states (e.g. 'true', 'false', '0', '1', 'yes', 'no')
 */
function isBooleanList(values: string[]): boolean {
  if (values.length === 0) return false;
  const truthySet = ['true', '1', 't', 'yes', 'y'];
  const falsySet = ['false', '0', 'f', 'no', 'n'];
  
  return values.every(value => {
    if (value === "") return true;
    const lower = value.toLowerCase();
    return truthySet.includes(lower) || falsySet.includes(lower);
  });
}

/**
 * Very basic ISO Date / Date string check (YYYY-MM-DD)
 */
function isDateList(values: string[]): boolean {
  if (values.length === 0) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  return values.every(value => {
    if (value === "") return true;
    return dateRegex.test(value);
  });
}

/**
 * Detects basic ISO timestamp structures (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
function isTimestampList(values: string[]): boolean {
  if (values.length === 0) return false;
  
  return values.every(value => {
    if (value === "") return true;
    const date = new Date(value);
    // Ensure it's a valid date and contains time indicators (like 'T' or ':')
    return !isNaN(date.getTime()) && (value.includes('T') || value.includes(':'));
  });
}

/**
 * Main pure function to detect the SQL type given an array of raw string values.
 * Evaluates sequentially from tightest constraints to loosest (VARCHAR).
 */
export function detectColumnType(rawValues: any[]): string {
  // Map values to strings for consistent regex / coercion tests
  const values = rawValues
    .filter(val => val !== null && val !== undefined)
    .map(String)
    .map(v => v.trim());

  // If the entire column is empty, default to VARCHAR
  if (values.filter(Boolean).length === 0) return 'VARCHAR';

  if (isBooleanList(values)) return 'BOOLEAN';
  if (isIntegerList(values)) return 'INT';
  if (isDecimalList(values)) return 'DECIMAL';
  if (isDateList(values)) return 'DATE';
  if (isTimestampList(values)) return 'TIMESTAMP';
  
  // Fallback to text
  return 'VARCHAR';
}

/**
 * Helper function to determine if a column should remain nullable.
 * True if ANY value in the array is null, undefined, or strictly an empty string "".
 */
export function detectNullable(values: any[]): boolean {
  return values.some(val => val === null || val === undefined || String(val).trim() === '');
}
