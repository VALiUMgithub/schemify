// apps/api/src/modules/database/adapters/mysql.adapter.ts
import * as mysql from 'mysql2/promise';
import { DatabaseAdapter, DatabaseConfiguration, TestConnectionResult } from './strategy.interface';

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

  async testConnection(config: DatabaseConfiguration): Promise<TestConnectionResult> {
    const startTime = Date.now();
    let testConnection: mysql.Connection | null = null;

    try {
      testConnection = await mysql.createConnection({
        host: config.host,
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        connectTimeout: 10000,
      });
      
      await testConnection.query('SELECT 1');
      const connectionTimeMs = Date.now() - startTime;
      await testConnection.end();
      
      return {
        success: true,
        message: 'Connection successful',
        connectionTimeMs,
      };
    } catch (error: any) {
      const connectionTimeMs = Date.now() - startTime;
      if (testConnection) {
        try {
          await testConnection.end();
        } catch {
          // Ignore disconnect errors
        }
      }
      
      return {
        success: false,
        message: error.message || 'Connection failed',
        connectionTimeMs,
      };
    }
  }

  async createTable(sql: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected to MySQL');
    
    await this.connection.query(sql);
  }

  async insertRows(tableName: string, columns: string[], rows: any[][]): Promise<number> {
    if (!this.connection) throw new Error('Not connected to MySQL');
    if (!rows.length) return 0;

    // MySQL has a max_allowed_packet limit, batch inserts to avoid issues
    const batchSize = 1000; // Safe batch size for MySQL
    const columnsString = columns.map(col => `\`${col}\``).join(', ');
    let totalRowsInserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const query = `INSERT INTO \`${tableName}\` (${columnsString}) VALUES ?`;
      
      // Using bulk insert arrays in mysql2
      const [result] = await this.connection.query<mysql.ResultSetHeader>(query, [batch]);
      totalRowsInserted += result.affectedRows;
    }

    return totalRowsInserted;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}
