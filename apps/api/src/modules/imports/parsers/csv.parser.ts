import fs from 'fs';
import Papa from 'papaparse';
import { IFileParser, ParsedData, ParsedColumnData } from './parser.interface';

export class CsvParser implements IFileParser {
  async parse(filePath: string): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      // Read the CSV file as a stream
      const fileStream = fs.createReadStream(filePath);
      
      let rowsPreview: Record<string, any>[] = [];
      let headers: string[] = [];

      Papa.parse(fileStream, {
        header: true,
        preview: 20, // PapaParse's built-in preview limit
        skipEmptyLines: true,
        step: (results, parser) => {
          // Inside step, headers are already available if header: true
          if (headers.length === 0 && results.meta.fields) {
            headers = results.meta.fields;
          }
          rowsPreview.push(results.data as Record<string, any>);
        },
        complete: () => {
          // If the file was so small step didn't trigger meta extraction gracefully
          if (headers.length === 0 && rowsPreview.length > 0) {
             headers = Object.keys(rowsPreview[0]);
          }

          // Build parsed columns structure
          const columns: ParsedColumnData[] = headers.map((colName, index) => {
            // Pick a sample value from the first row if available
            const sample = rowsPreview.length > 0 ? String(rowsPreview[0][colName] ?? '') : null;
            return {
              name: colName,
              sampleValue: sample ? sample.substring(0, 255) : null, // keep sane lengths
              order: index + 1,
            };
          });

          resolve({ columns, rowsPreview });
        },
        error: (error) => {
          reject(new Error(`CSV Parsing failed: ${error.message}`));
        },
      });
    });
  }
}
