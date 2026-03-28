export interface DatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    executeScript(sql: string): Promise<void>;
    insertRows(tableName: string, columns: string[], rows: any[][]): Promise<number>;
}
