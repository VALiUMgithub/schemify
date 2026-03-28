export interface ParsedColumnData {
  name: string;
  sampleValue?: string | null;
  order: number;
}

export interface ParsedData {
  columns: ParsedColumnData[];
  rowsPreview: Record<string, any>[]; // Array of key-value pairs representing rows
  totalRowCount: number; // Total number of rows in the file
}

export interface IFileParser {
  /**
   * Reads a file, extracts headers, and returns a preview of the first 50 rows.
   * Also includes the total row count in the file.
   */
  parse(filePath: string): Promise<ParsedData>;

  /**
   * Extracts absolutely all rows from the entire file, in sequential arrays matching headers 
   */
  parseAll(filePath: string): Promise<{ headers: string[], rows: any[][] }>;
}
