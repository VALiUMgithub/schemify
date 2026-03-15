import fs from 'fs';
import path from 'path';

// Define base upload directory inside apps/api for local testing
const BASE_UPLOAD_DIR = path.join(process.cwd(), 'uploads/imports');

export const FileStorageUtil = {
  /**
   * Generates and ensures the directory exists for a specific project
   */
  generateFilePath(projectId: string): string {
    const dirPath = path.join(BASE_UPLOAD_DIR, projectId);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    return dirPath;
  },

  /**
   * Generates a unique safety-checked filename
   * e.g. "my_data-1709401235.csv"
   */
  generateFileName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const name = path.basename(originalName, ext);
    
    // Remove spaces and special characters from the original name
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    
    return `${safeName}-${timestamp}${ext}`;
  }
};
