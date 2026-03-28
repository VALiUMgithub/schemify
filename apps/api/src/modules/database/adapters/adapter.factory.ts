// apps/api/src/modules/database/adapters/adapter.factory.ts
import { DatabaseAdapter } from './strategy.interface';
import { PostgresAdapter } from './postgres.adapter';
import { MysqlAdapter } from './mysql.adapter';
import { MssqlAdapter } from './mssql.adapter';

export class DatabaseAdapterFactory {
  static getAdapter(databaseType: string): DatabaseAdapter {
    switch (databaseType.toLowerCase()) {
      case 'postgres':
      case 'postgresql':
        return new PostgresAdapter();
      case 'mysql':
        return new MysqlAdapter();
      case 'mssql':
      case 'sqlserver':
        return new MssqlAdapter();
      default:
        throw new Error(`Unsupported database type for execution: ${databaseType}`);
    }
  }
}
