// apps/api/src/modules/database/adapters/mssql.adapter.ts
import * as sql from 'mssql';
import { DatabaseAdapter, DatabaseConfiguration, TestConnectionResult } from './strategy.interface';

export class MssqlAdapter implements DatabaseAdapter {
  private pool: sql.ConnectionPool | null = null;

  async connect(config: DatabaseConfiguration): Promise<void> {
    const sqlConfig: sql.config = {
      server: config.host,
      port: config.port || 1433,
      user: config.user,
      password: config.password,
      database: config.database,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    this.pool = new sql.ConnectionPool(sqlConfig);
    await this.pool.connect();
  }

  async testConnection(config: DatabaseConfiguration): Promise<TestConnectionResult> {
    const startTime = Date.now();
    let testPool: sql.ConnectionPool | null = null;

    try {
      const sqlConfig: sql.config = {
        server: config.host,
        port: config.port || 1433,
        user: config.user,
        password: config.password,
        database: config.database,
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
        connectionTimeout: 10000,
      };

      testPool = new sql.ConnectionPool(sqlConfig);
      await testPool.connect();
      await testPool.request().query('SELECT 1');
      const connectionTimeMs = Date.now() - startTime;
      await testPool.close();
      
      return {
        success: true,
        message: 'Connection successful',
        connectionTimeMs,
      };
    } catch (error: any) {
      const connectionTimeMs = Date.now() - startTime;
      if (testPool) {
        try {
          await testPool.close();
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

  async createTable(ddlSql: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected to MSSQL');
    
    await this.pool.request().query(ddlSql);
  }

  async insertRows(tableName: string, columns: string[], rows: any[][]): Promise<number> {
    if (!this.pool) throw new Error("Not connected to MSSQL");
    if (!rows.length) return 0;

    const maxParams = 2000;
    const batchSize = Math.max(1, Math.floor(maxParams / columns.length));
    const quotedColumns = columns.map(col => "[" + col + "]").join(", ");
    let rowsAffected = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const request = new sql.Request(this.pool);
      let sqlStr = "INSERT INTO [" + tableName + "] (" + quotedColumns + ") VALUES ";
      const valueGroups: string[] = [];

      batch.forEach((row, rowIdx) => {
        const paramNames: string[] = [];
        columns.forEach((col, colIdx) => {
          const paramName = "p_" + rowIdx + "_" + colIdx;
          let val = row[colIdx];
          if (val === "" || val === undefined) val = null;
          request.input(paramName, val);
          paramNames.push("@" + paramName);
        });
        valueGroups.push("(" + paramNames.join(", ") + ")");
      });

      sqlStr += valueGroups.join(", ");
      const result = await request.query(sqlStr);
      rowsAffected += result.rowsAffected[0] || batch.length;
    }

    return rowsAffected;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }
}
