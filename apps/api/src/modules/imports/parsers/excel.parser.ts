import ExcelJS from 'exceljs';
import { IFileParser, ParsedData, ParsedColumnData } from './parser.interface';

export class ExcelParser implements IFileParser {
  async parse(filePath: string): Promise<ParsedData> {
    const workbook = new ExcelJS.Workbook();
    
    // Read the file directly into the workbook
    await workbook.xlsx.readFile(filePath);

    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheets found in the Excel file');
    }

    // Attempt to parse headers from the first row
    const firstRow = worksheet.getRow(1);
    if (!firstRow.values || !firstRow.hasValues) {
      throw new Error('The worksheet appears to have no headers on row 1');
    }

    // ExcelJS rows are 1-indexed and the first element is usually empty or null
    // Extract header names cleanly
    const headers: string[] = [];
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.text.trim(); // store zero-indexed logically
    });

    const rowsPreview: Record<string, any>[] = [];
    
    // Extract up to the first 20 rows of data (starting at row 2)
    let count = 0;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers
      if (count >= 20) return;     // Cap preview

      const rowData: Record<string, any> = {};
      
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerName = headers[colNumber - 1];
        if (headerName) {
          // Convert cell value to a string baseline
          rowData[headerName] = cell.text; 
        }
      });

      rowsPreview.push(rowData);
      count++;
    });

    // Build the columns schema based on headers
    const columns: ParsedColumnData[] = headers.filter(Boolean).map((colName, index) => {
       const sample = rowsPreview.length > 0 ? String(rowsPreview[0][colName] ?? '') : null;
       return {
         name: colName,
         sampleValue: sample ? sample.substring(0, 255) : null,
         order: index + 1,
       };
    });

    return { columns, rowsPreview };
  }
}
