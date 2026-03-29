// apps/api/src/modules/database/adapters/strategy.interface.ts

export interface DatabaseConfiguration {
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  connectionTimeMs: number;
}

export interface DatabaseAdapter {
  /**
   * Connect to the external database
   */
  connect(config: DatabaseConfiguration): Promise<void>;

  /**
   * Test connection to the external database without maintaining connection
   */
  testConnection(config: DatabaseConfiguration): Promise<TestConnectionResult>;

  /**
   * Execute the generated SQL schema (DDL) to create tables
   */
  createTable(sql: string): Promise<void>;

  /**
   * Insert rows into the newly created table
   */
  insertRows(tableName: string, columns: string[], rows: any[][]): Promise<number>;

  /**
   * Close the connection
   */
  disconnect(): Promise<void>;
}
