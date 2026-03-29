// apps/api/src/modules/database/adapters/postgres.adapter.ts
import { Client } from 'pg';
import { DatabaseAdapter, DatabaseConfiguration, TestConnectionResult } from './strategy.interface';

export class PostgresAdapter implements DatabaseAdapter {
  private client: Client | null = null;

  async connect(config: DatabaseConfiguration): Promise<void> {
    this.client = new Client({
      host: config.host,
      port: config.port || 5432,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    
    await this.client.connect();
  }

  async testConnection(config: DatabaseConfiguration): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const testClient = new Client({
      host: config.host,
      port: config.port || 5432,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionTimeoutMillis: 10000,
    });

    try {
      await testClient.connect();
      await testClient.query('SELECT 1');
      const connectionTimeMs = Date.now() - startTime;
      await testClient.end();
      
      return {
        success: true,
        message: 'Connection successful',
        connectionTimeMs,
      };
    } catch (error: any) {
      const connectionTimeMs = Date.now() - startTime;
      try {
        await testClient.end();
      } catch {
        // Ignore disconnect errors
      }
      
      return {
        success: false,
        message: error.message || 'Connection failed',
        connectionTimeMs,
      };
    }
  }

  async createTable(sql: string): Promise<void> {
    if (!this.client) throw new Error('Not connected to Postgres');
    
    // Execute DDL
    await this.client.query(sql);
  }

  async insertRows(tableName: string, columns: string[], rows: any[][]): Promise<number> {
    if (!this.client) throw new Error('Not connected to Postgres');
    if (!rows.length) return 0;

    // PostgreSQL has a parameter limit (around 32767 parameters per query)
    // We batch inserts to stay within this limit
    const maxParams = 30000; // Leave some headroom
    const batchSize = Math.max(1, Math.floor(maxParams / columns.length));
    
    const columnsString = columns.map(col => `"${col}"`).join(', ');
    let totalRowsInserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const valueGroups: string[] = [];
      const valuesArray: any[] = [];
      let placeholderIdx = 1;
      
      for (const row of batch) {
        const rowPlaceholders: string[] = [];
        for (let j = 0; j < columns.length; j++) {
          rowPlaceholders.push(`$${placeholderIdx++}`);
          valuesArray.push(row[j] ?? null);
        }
        valueGroups.push(`(${rowPlaceholders.join(', ')})`);
      }

      const query = `INSERT INTO "${tableName}" (${columnsString}) VALUES ${valueGroups.join(', ')}`;
      const result = await this.client.query(query, valuesArray);
      totalRowsInserted += result.rowCount ?? 0;
    }

    return totalRowsInserted;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
