export interface ParsedColumnData {
  name: string;
  sampleValue?: string | null;
  order: number;
}

export interface ParsedData {
  columns: ParsedColumnData[];
  rowsPreview: Record<string, any>[]; // Array of key-value pairs representing rows
}

export interface IFileParser {
  /**
   * Reads a file, extracts headers, and returns a preview of the first 20 rows.
   */
  parse(filePath: string): Promise<ParsedData>;
}
