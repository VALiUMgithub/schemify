// apps/api/src/modules/database/adapters/mysql.adapter.ts
import * as mysql from 'mysql2/promise';
import { DatabaseAdapter, DatabaseConfiguration } from './strategy.interface';

export class MysqlAdapter implements DatabaseAdapter {
  private connection: mysql.Connection | null = null;

  async connect(config: DatabaseConfiguration): Promise<void> {
    this.connection = await mysql.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true // Allow complex DDL or multiple queries
    });
  }

  async createTable(sql: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected to MySQL');
    
    await this.connection.query(sql);
  }

  async insertRows(tableName: string, columns: string[], rows: any[][]): Promise<number> {
    if (!this.connection) throw new Error('Not connected to MySQL');
    if (!rows.length) return 0;

    const columnsString = columns.map(col => `\`${col}\``).join(', ');
    const query = `INSERT INTO \`${tableName}\` (${columnsString}) VALUES ?`;
    
    // Using bulk insert arrays in mysql2
    const [result] = await this.connection.query<mysql.ResultSetHeader>(query, [rows]);
    return result.affectedRows;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}
