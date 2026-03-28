import { ISqlGenerator } from './generator.interface';
import { PostgresGenerator } from './postgres.generator';
import { MysqlGenerator } from './mysql.generator';
import { MssqlGenerator } from './mssql.generator';

export type DatabaseType = 'postgres' | 'mysql' | 'mssql';

export class GeneratorFactory {
  static getGenerator(type: DatabaseType): ISqlGenerator {
    switch (type) {
      case 'postgres':
        return new PostgresGenerator();
      case 'mysql':
        return new MysqlGenerator();
      case 'mssql':
        return new MssqlGenerator();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
}