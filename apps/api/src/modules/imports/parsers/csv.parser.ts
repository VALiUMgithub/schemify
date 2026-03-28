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
      let totalRowCount = 0;

      Papa.parse(fileStream, {
        header: true,
        skipEmptyLines: true,
        step: (results, parser) => {
          // Inside step, headers are already available if header: true
          if (headers.length === 0 && results.meta.fields) {
            headers = results.meta.fields;
          }
          // Keep only first 50 rows as preview
          if (rowsPreview.length < 50) {
            rowsPreview.push(results.data as Record<string, any>);
          }
          // Count total rows
          totalRowCount++;
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

          resolve({ columns, rowsPreview, totalRowCount });
        },
        error: (error) => {
          reject(new Error(`CSV Parsing failed: ${error.message}`));
        },
      });
    });
  }

  async parseAll(filePath: string): Promise<{ headers: string[], rows: any[][] }> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      
      let headers: string[] = [];
      const rows: any[][] = [];

      Papa.parse(fileStream, {
        header: true,
        skipEmptyLines: true,
        step: (results) => {
          if (headers.length === 0 && results.meta.fields) {
            headers = results.meta.fields;
          }
          
          // PapaParse with header:true gives objects. Convert to flat array matching headers order
          const rowObj = results.data as Record<string, any>;
          const rowArr = headers.map(h => rowObj[h]);
          rows.push(rowArr);
        },
        complete: () => {
          if (headers.length === 0 && rows.length > 0) {
            // Unlikely to happen with empty headers but just in case
            resolve({ headers: [], rows: [] });
            return;
          }
          resolve({ headers, rows });
        },
        error: (error) => {
          reject(new Error(`CSV Parsing failed: ${error.message}`));
        },
      });
    });
  }
}
