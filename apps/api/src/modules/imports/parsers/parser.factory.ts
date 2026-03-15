import path from 'path';
import { IFileParser } from './parser.interface';
import { CsvParser } from './csv.parser';
import { ExcelParser } from './excel.parser';

export class ParserFactory {
  /**
   * Returns the appropriate parser class based on the file extension
   */
  static getParser(filePath: string): IFileParser {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.csv':
        return new CsvParser();
      case '.xlsx':
      case '.xls':
        return new ExcelParser();
      default:
        throw new Error(`Unsupported file type: ${ext}. Cannot parse.`);
    }
  }
}
