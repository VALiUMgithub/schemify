// apps/api/src/modules/database/adapters/postgres.adapter.ts
import { Client } from 'pg';
import { DatabaseAdapter, DatabaseConfiguration } from './strategy.interface';

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

  async createTable(sql: string): Promise<void> {
    if (!this.client) throw new Error('Not connected to Postgres');
    
    // Execute DDL
    await this.client.query(sql);
  }

  async insertRows(tableName: string, columns: string[], rows: any[][]): Promise<number> {
    if (!this.client) throw new Error('Not connected to Postgres');
    if (!rows.length) return 0;

    // A simple, unoptimized bulk insert approach with parameterized values.
    // E.g., INSERT INTO "table" ("col1", "col2") VALUES ($1, $2), ($3, $4)
    const columnsString = columns.map(col => `"${col}"`).join(', ');
    
    // Build values string and flattened arguments array
    const valueGroups = [];
    const valuesArray = [];
    let placeholderIdx = 1;
    
    for (const row of rows) {
      const rowPlaceholders = [];
      for (let i = 0; i < columns.length; i++) {
        rowPlaceholders.push(`$${placeholderIdx++}`);
        valuesArray.push(row[i] ?? null);
      }
      valueGroups.push(`(${rowPlaceholders.join(', ')})`);
    }

    const query = `INSERT INTO "${tableName}" (${columnsString}) VALUES ${valueGroups.join(', ')}`;
    
    const result = await this.client.query(query, valuesArray);
    return result.rowCount ?? 0;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
