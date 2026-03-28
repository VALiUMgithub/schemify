export interface ColumnTypeSpec {
  base: string;
  size: number | 'MAX' | null;
  hasExplicitSize: boolean;
}

export function parseColumnTypeSpec(rawType: string | null | undefined): ColumnTypeSpec {
  const normalized = (rawType ?? 'VARCHAR').trim().toUpperCase();
  const match = normalized.match(/^([A-Z]+)\s*(?:\(\s*(MAX|\d+)\s*\))?$/);

  if (!match) {
    return { base: 'VARCHAR', size: null, hasExplicitSize: false };
  }

  const base = match[1];
  const sizeToken = match[2];

  if (!sizeToken) {
    return { base, size: null, hasExplicitSize: false };
  }

  if (sizeToken === 'MAX') {
    return { base, size: 'MAX', hasExplicitSize: true };
  }

  const size = Number.parseInt(sizeToken, 10);
  if (!Number.isFinite(size) || size <= 0) {
    return { base, size: null, hasExplicitSize: false };
  }

  return { base, size, hasExplicitSize: true };
}

export function resolvePostgresType(rawType: string): string {
  const spec = parseColumnTypeSpec(rawType);

  switch (spec.base) {
    case 'INT':
    case 'INTEGER':
      return 'INTEGER';
    case 'FLOAT':
      return 'DOUBLE PRECISION';
    case 'DECIMAL':
      return 'DECIMAL';
    case 'NUMERIC':
      return 'NUMERIC';
    case 'BOOLEAN':
    case 'DATE':
    case 'TIMESTAMP':
    case 'TEXT':
      return spec.base;
    case 'NVARCHAR':
    case 'VARCHAR':
      if (spec.size === 'MAX') return 'TEXT';
      if (typeof spec.size === 'number') return `VARCHAR(${spec.size})`;
      return 'VARCHAR(255)';
    default:
      return 'VARCHAR(255)';
  }
}

export function resolveMysqlType(rawType: string): string {
  const spec = parseColumnTypeSpec(rawType);

  switch (spec.base) {
    case 'INT':
    case 'INTEGER':
      return 'INT';
    case 'FLOAT':
      return 'FLOAT';
    case 'DECIMAL':
      return 'DECIMAL';
    case 'NUMERIC':
      return 'NUMERIC';
    case 'BOOLEAN':
      return 'BOOLEAN';
    case 'DATE':
      return 'DATE';
    case 'TIMESTAMP':
      return 'DATETIME';
    case 'TEXT':
      return 'TEXT';
    case 'NVARCHAR':
    case 'VARCHAR':
      if (spec.size === 'MAX') return 'LONGTEXT';
      if (typeof spec.size === 'number') return `VARCHAR(${spec.size})`;
      return 'VARCHAR(255)';
    default:
      return 'VARCHAR(255)';
  }
}

export function resolveMssqlType(rawType: string): string {
  const spec = parseColumnTypeSpec(rawType);

  switch (spec.base) {
    case 'INT':
    case 'INTEGER':
      return 'INT';
    case 'FLOAT':
      return 'FLOAT';
    case 'DECIMAL':
      return 'DECIMAL';
    case 'NUMERIC':
      return 'NUMERIC';
    case 'BOOLEAN':
      return 'BIT';
    case 'DATE':
      return 'DATE';
    case 'TIMESTAMP':
      return 'DATETIME2';
    case 'TEXT':
      return 'NVARCHAR(MAX)';
    case 'NVARCHAR':
      if (spec.size === 'MAX') return 'NVARCHAR(MAX)';
      if (typeof spec.size === 'number') return `NVARCHAR(${spec.size})`;
      return 'NVARCHAR(255)';
    case 'VARCHAR':
      if (spec.size === 'MAX') return 'VARCHAR(MAX)';
      if (typeof spec.size === 'number') return `VARCHAR(${spec.size})`;
      return 'VARCHAR(255)';
    default:
      return 'NVARCHAR(255)';
  }
}
